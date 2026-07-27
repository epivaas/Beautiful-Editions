import { supabase } from "@/utils/supabase";
import Link from "next/link";

interface PublisherSummary {
  id: number;
  name: string;
}

interface SeriesSummary {
  id: number;
  name: string;
  publisher: { id: number; name: string }[] | null;
}

async function getPublishers(): Promise<PublisherSummary[]> {
  const { data, error } = await supabase
    .from("publishers")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching publishers:", error);
    return [];
  }

  return (data || []) as PublisherSummary[];
}

async function getSeries(): Promise<SeriesSummary[]> {
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
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching series:", error);
    return [];
  }

  return (data || []) as SeriesSummary[];
}

export default async function PublishersSeriesPage() {
  const publishers = await getPublishers();
  const series = await getSeries();

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">
        Publishers & Series
      </h1>

      <div className="publisher-series-grid">
        <div className="w-full bg-white border border-[#e0ddd0] rounded p-6">
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">Publishers</h2>

          {publishers.length === 0 ? (
            <p className="text-[#6b6b6b]">No publishers found.</p>
          ) : (
            <ul className="space-y-3">
              {publishers.map((publisher) => (
                <li key={publisher.id}>
                  <Link
                    href={`/publishers-series/${publisher.id}`}
                    className="text-[#8b6f47] hover:underline font-medium"
                  >
                    {publisher.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-full bg-white border border-[#e0ddd0] rounded p-6">
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">Series</h2>

          {series.length === 0 ? (
            <p className="text-[#6b6b6b]">No series found.</p>
          ) : (
            <ul className="space-y-3">
              {series.map((item) => {
                const publisherList = Array.isArray(item.publisher) ? item.publisher : [];
                const publisherName = publisherList[0]?.name || null;

                return (
                  <li key={item.id}>
                    <Link
                      href={`/publishers-series/${item.id}`}
                      className="text-[#8b6f47] hover:text-[#6f5330] hover:underline transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                    {publisherName && (
                      <span className="text-[#6b6b6b] ml-2">({publisherName})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

