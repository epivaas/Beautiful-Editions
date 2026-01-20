import { supabase } from "@/utils/supabase";
import { Work, EditionWithRelations } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getWork(id: number): Promise<any | null> {
  const { data, error } = await supabase
    .from("works")
    .select(`
      *,
      work_authors (
        author:authors (
          id,
          name,
          wiki_link
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getEditionsForWork(workId: number): Promise<EditionWithRelations[]> {
  const { data, error } = await supabase
    .from("editions")
    .select(`
      *,
      publisher:publishers (
        id,
        name
      ),
      series:series (
        id,
        name
      ),
      photos (
        id,
        storage_path,
        sort_order
      )
    `)
    .eq("work_id", workId)
    .order("publication_year", { ascending: false });

  if (error) {
    console.error("Error fetching editions:", error);
    return [];
  }

  return (data || []) as EditionWithRelations[];
}

export default async function TitleDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const resolvedParams = params instanceof Promise ? await params : params;
  const work = await getWork(parseInt(resolvedParams.id));

  if (!work) {
    notFound();
  }

  const editions = await getEditionsForWork(work.id);
  const authors = (work as any).work_authors?.map((wa: any) => wa.author) || [];

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto">
        {/* Work Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#8b6f47] mb-2">
            {work.original_title}
          </h1>
          {work.english_title && (
            <p className="text-xl text-[#6b6b6b] italic mb-2">
              {work.english_title}
            </p>
          )}
          {authors.length > 0 && (
            <p className="text-lg text-[#6b6b6b]">
              by {authors.map((a) => a.name).join(", ")}
            </p>
          )}
          {work.original_publication_year && (
            <p className="text-[#8b6f47] mt-2">
              Originally published: {work.original_publication_year}
            </p>
          )}
          {work.original_language && (
            <p className="text-[#6b6b6b] mt-1">
              Original language: {work.original_language}
            </p>
          )}
          {work.wiki_link && (
            <a
              href={work.wiki_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b6f47] hover:underline mt-2 inline-block"
            >
              View reference source →
            </a>
          )}
        </div>

        {/* Editions List */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-[#8b6f47] mb-6">
            Editions ({editions.length})
          </h2>

          {editions.length === 0 ? (
            <div className="bg-white border border-[#e0ddd0] rounded p-8 text-center text-[#6b6b6b]">
              No editions available for this title
            </div>
          ) : (
            <div className="space-y-4">
              {editions.map((edition) => {
                const firstPhoto =
                  edition.photos && edition.photos.length > 0
                    ? edition.photos.sort((a, b) => a.sort_order - b.sort_order)[0]
                    : null;

                return (
                  <Link
                    key={edition.id}
                    href={`/edition/${edition.id}`}
                    className="block bg-white border border-[#e0ddd0] rounded p-6 hover:shadow-lg transition bibliophilic-hover"
                  >
                    <div className="flex gap-6">
                      {firstPhoto && (
                        <div className="flex-shrink-0">
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${firstPhoto.storage_path}`}
                            alt={edition.title}
                            className="w-24 h-32 object-cover rounded border border-[#e0ddd0]"
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="text-xl font-serif text-[#8b6f47] mb-2">
                          {edition.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-[#6b6b6b] mb-2">
                          {edition.publisher && (
                            <span>{edition.publisher.name}</span>
                          )}
                          {edition.series && (
                            <span className="italic">{edition.series.name}</span>
                          )}
                          {edition.publication_year && (
                            <span>{edition.publication_year}</span>
                          )}
                        </div>
                        {edition.language && (
                          <p className="text-sm text-[#6b6b6b]">
                            Language: {edition.language}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

