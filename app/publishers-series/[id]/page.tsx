import { supabase } from "@/utils/supabase";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { fetchAllRows, fetchAllRowsInChunks } from "@/utils/supabasePagination";
import { getPublisherList } from "@/app/lib/overviewQueries";
import { activeSpan } from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import { TextLink } from "@/components/Button";

interface WorkSummary {
  id: number;
  original_title: string;
  english_title: string | null;
}

interface EditionWithWorks {
  id: number;
  publication_year: number | null;
  works: WorkSummary[];
}

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

/** Only whether a series exists: old links to a series used this route. */
async function seriesExists(id: number) {
  const { data } = await supabase.from("series").select("id").eq("id", id).maybeSingle();
  return data !== null;
}

async function getEditionsForPublisher(publisherId: number): Promise<EditionWithWorks[]> {
  const { data: editionsData, error: editionsError } = await fetchAllRows(() =>
    supabase
      .from("editions")
      .select("id, publication_year")
      .eq("publisher_id", publisherId)
      .order("publication_year", { ascending: false })
      // Unique tiebreaker so pagination never skips or repeats rows
      .order("id", { ascending: true })
  );

  if (editionsError) {
    console.error("Error fetching publisher editions:", editionsError);
    return [];
  }

  const editionIds = (editionsData || []).map((edition) => edition.id).filter(Boolean);

  if (editionIds.length === 0) {
    return [];
  }

  const { data: linksData, error: linksError } = await fetchAllRowsInChunks(
    editionIds,
    (editionIdChunk) => supabase
      .from("work_editions")
      .select("edition_id, work_id")
      .in("edition_id", editionIdChunk)
  );

  if (linksError) {
    console.error("Error fetching publisher work links:", linksError);
    return [];
  }

  const workIds = Array.from(new Set((linksData || []).map((link) => link.work_id).filter(Boolean)));
  let worksById: Record<number, WorkSummary> = {};

  if (workIds.length > 0) {
    const { data: worksData, error: worksError } = await fetchAllRowsInChunks(
      workIds,
      (workIdChunk) => supabase
        .from("works")
        .select("id, original_title, english_title")
        .in("id", workIdChunk)
    );

    if (worksError) {
      console.error("Error fetching publisher works:", worksError);
    } else {
      worksById = Object.fromEntries((worksData || []).map((work) => [work.id, work]));
    }
  }

  return (editionsData || []).map((edition) => ({
    id: edition.id,
    publication_year: edition.publication_year,
    works: (linksData || [])
      .filter((link) => link.edition_id === edition.id)
      .map((link) => worksById[link.work_id])
      .filter(Boolean),
  }));
}

function groupByYear(editions: EditionWithWorks[]): GroupedYear[] {
  const grouped = new Map<string, Array<{ edition_id: number; original_title: string; english_title: string | null }>>();

  editions.forEach((edition) => {
    const year = edition.publication_year ? String(edition.publication_year) : "Unknown";

    if (!grouped.has(year)) {
      grouped.set(year, []);
    }

    const existingWorks = grouped.get(year) || [];
    edition.works.forEach((work) => {
      existingWorks.push({
        edition_id: edition.id,
        original_title: work.original_title,
        english_title: work.english_title,
      });
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
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ kind?: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = parseInt(resolvedParams.id, 10);

  if (Number.isNaN(id)) {
    notFound();
  }

  // Series have their own page now; ?kind=series was how the shared route asked for one
  const wantsSeries = (await searchParams).kind === "series";
  const publisher = wantsSeries ? null : await getPublisher(id);
  if (!publisher) {
    if (await seriesExists(id)) permanentRedirect(`/series/${id}`);
    notFound();
  }

  const editions = await getEditionsForPublisher(publisher.id);
  const groupedYears = groupByYear(editions);

  // Same numbers as on the Publishers overview (cached list)
  const now = new Date().getFullYear();
  const listRow = (await getPublisherList()).find((p) => p.id === publisher.id);
  const span = listRow ? activeSpan([listRow.firstYear, listRow.lastYear], now) : null;
  const band = {
    pill: "Publisher",
    title: publisher.name.trim(),
    sentence: ["Publisher", span].filter(Boolean).join(" · "),
    back: { href: "/publishers", label: "Publishers" },
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href={band.back.href} standalone>
            {band.back.label}
          </TextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {band.title}
          </span>
        </nav>
        <ListBand
          pill={band.pill}
          title={band.title}
          sentence={band.sentence}
          count={listRow?.titles ?? 0}
          label={["title", "titles"]}
        />
      </div>

      {/* The list below is restyled in the step for the publisher page (year bar, board Overzichten) */}
      <div className="py-2">
      <div className="max-w-5xl mx-auto">
        {groupedYears.length === 0 ? (
          <div className="bg-white border border-[#e0ddd0] rounded p-8 text-center text-[#6b6b6b]">
            No works found for this publisher.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedYears.map((group) => (
              <div key={group.year}>
                <h2 className="text-3xl font-serif text-[#8b6f47] mb-4">{group.year}</h2>
                <ul className="space-y-3 pl-4 border-l border-[#e0ddd0]">
                  {group.works.map((work, index) => (
                    <li key={`${work.edition_id}-${work.original_title}-${index}`}>
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
    </div>
  );
}
