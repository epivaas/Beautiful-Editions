import { supabase } from "@/utils/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

interface GroupedYear {
  year: string;
  works: Array<{
    edition_id: number;
    original_title: string;
    english_title: string | null;
  }>;
}

async function getPublisher(id: number) {
  const { data, error } = await supabase
    .from("publishers")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getSeries(id: number) {
  const { data, error } = await supabase
    .from("series")
    .select(`
      id,
      name,
      publisher:publishers (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getEditionsForPublisher(publisherId: number) {
  const { data, error } = await supabase
    .from("editions")
    .select(`
      id,
      publication_year,
      work:works (
        id,
        original_title,
        english_title
      )
    `)
    .eq("publisher_id", publisherId)
    .order("publication_year", { ascending: false });

  if (error) {
    console.error("Error fetching publisher editions:", error);
    return [];
  }

  return data || [];
}

async function getEditionsForSeries(seriesId: number) {
  const { data, error } = await supabase
    .from("editions")
    .select(`
      id,
      publication_year,
      work:works (
        id,
        original_title,
        english_title
      )
    `)
    .eq("series_id", seriesId)
    .order("publication_year", { ascending: false });

  if (error) {
    console.error("Error fetching series editions:", error);
    return [];
  }

  return data || [];
}

function groupByYear(editions: any[]): GroupedYear[] {
  const grouped = new Map<string, Array<{ edition_id: number; original_title: string; english_title: string | null }>>();

  editions.forEach((edition) => {
    const year = edition.publication_year ? String(edition.publication_year) : "Unknown";
    const work = edition.work;

    if (!work) {
      return;
    }

    if (!grouped.has(year)) {
      grouped.set(year, []);
    }

    const existingWorks = grouped.get(year) || [];
    existingWorks.push({
      edition_id: edition.id,
      original_title: work.original_title,
      english_title: work.english_title,
    });
  });

  return Array.from(grouped.entries())
    .map(([year, works]) => ({ year, works }))
    .sort((a, b) => {
      if (a.year === "Unknown") return 1;
      if (b.year === "Unknown") return -1;
      return Number(a.year) - Number(b.year);
    });
}

export default async function PublisherSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = parseInt(resolvedParams.id, 10);

  if (Number.isNaN(id)) {
    notFound();
  }

  const publisher = await getPublisher(id);
  const series = await getSeries(id);

  if (!publisher && !series) {
    notFound();
  }

  const editions = publisher
    ? await getEditionsForPublisher(publisher.id)
    : series
      ? await getEditionsForSeries(series.id)
      : [];

  const groupedYears = groupByYear(editions);
  const heading = publisher ? publisher.name : series?.name || "Collection";
  const subtitle = publisher
    ? "Works grouped by publication year"
    : Array.isArray(series?.publisher) && series.publisher.length > 0 && series.publisher[0]?.name
      ? `Series of ${series.publisher[0].name}`
      : "Works grouped by publication year";

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#8b6f47] mb-2">{heading}</h1>
          {subtitle && (
            <p className="text-lg text-[#6b6b6b]">{subtitle}</p>
          )}
        </div>

        {groupedYears.length === 0 ? (
          <div className="bg-white border border-[#e0ddd0] rounded p-8 text-center text-[#6b6b6b]">
            No works found for this {publisher ? "publisher" : "series"}.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedYears.map((group) => (
              <div key={group.year}>
                <h2 className="text-3xl font-serif text-[#8b6f47] mb-4">{group.year}</h2>
                <ul className="space-y-3 pl-4 border-l border-[#e0ddd0]">
                  {group.works.map((work) => (
                    <li key={work.edition_id}>
                      <Link
                        href={`/edition/${work.edition_id}`}
                        className="text-[#4f4a3d] hover:underline font-medium"
                      >
                        {work.original_title}
                      </Link>
                      {work.english_title && work.english_title !== work.original_title && (
                        <span className="text-[#6b6b6b] ml-2">({work.english_title})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
