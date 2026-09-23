import { supabase } from "@/utils/supabase";
import { Author, Work, EditionWithRelations } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchAllRows } from "@/utils/supabasePagination";

type WorkWithAuthors = Work & {
  work_authors?: { author: Author }[];
};

type EditionWithSubEditionCount = EditionWithRelations & {
  sub_edition_count: number;
};

type EditionPhoto = NonNullable<EditionWithRelations["photos"]>[number] & {
  is_main?: boolean;
};

async function getWork(id: number): Promise<WorkWithAuthors | null> {
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

  return data as WorkWithAuthors;
}

async function getEditionsForWork(workId: number): Promise<EditionWithSubEditionCount[]> {
  const { data: links, error: linksError } = await fetchAllRows(() =>
    supabase
      .from("work_editions")
      .select("edition_id")
      .eq("work_id", workId)
  );

  if (linksError) {
    console.error("Error fetching work-edition links:", linksError);
    return [];
  }

  const editionIds = (links || []).map(link => link.edition_id).filter(Boolean);

  if (editionIds.length === 0) {
    return [];
  }

  const { data, error } = await fetchAllRows(() =>
    supabase
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
          sort_order,
          is_main
        )
      `)
      .in("id", editionIds)
      .order("publication_year", { ascending: false })
  );

  if (error) {
    console.error("Error fetching editions:", error);
    return [];
  }

  const editionData = (data || []) as EditionWithRelations[];
  const fetchedEditionIds = editionData.map((edition) => edition.id);
  const { data: subEditions, error: subEditionsError } = await fetchAllRows(() =>
    supabase
      .from("sub_editions")
      .select("edition_id")
      .in("edition_id", fetchedEditionIds)
  );

  if (subEditionsError) {
    console.error("Error fetching sub-edition counts:", subEditionsError);
  }

  const subEditionCounts = new Map<number, number>();
  (subEditions || []).forEach((subEdition) => {
    subEditionCounts.set(
      subEdition.edition_id,
      (subEditionCounts.get(subEdition.edition_id) || 0) + 1
    );
  });

  return editionData.map((edition): EditionWithSubEditionCount => ({
    ...edition,
    sub_edition_count: subEditionCounts.get(edition.id) || 0,
  }));
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
  const authors = work.work_authors?.map((workAuthor) => workAuthor.author) || [];

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto">
        {/* Work Header */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-serif text-[#8b6f47] mb-2 text-center">
            {work.original_title}
          </h1>
          {work.english_title && work.english_title !== work.original_title && (
            <p className="text-xl text-[#6b6b6b] italic mb-2">
              Title in English: {work.english_title}
            </p>
          )}
          {authors.length > 0 && (
            <p className="text-lg text-[#6b6b6b]">
              by {authors.map((author, index) => (
                <span key={author.id}>
                  <Link href={`/author/${author.id}`} className="text-[#8b6f47] hover:underline">
                    {author.name}
                  </Link>
                  {index < authors.length - 1 && ", "}
                </span>
              ))}
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
          {work.wiki_link ? (
            <p className="text-[#6b6b6b] mt-2">
              authorative source →{" "}
              <a
                href={work.wiki_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b6f47] hover:underline"
              >
                {work.wiki_link}
              </a>
            </p>
          ) : (
            <p className="text-sm text-[#8b8b8b] mt-2">no authorative source found</p>
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
                const photos = (edition.photos || []) as EditionPhoto[];
                const firstPhoto =
                  photos.length > 0
                    ? [...photos].sort((a, b) => {
                        const mainPhotoDifference = Number(Boolean(b.is_main)) - Number(Boolean(a.is_main));
                        return mainPhotoDifference || a.sort_order - b.sort_order;
                      })[0]
                    : null;

                const subEditionCount = edition.sub_edition_count;

                return (
                  <div
                    key={edition.id}
                    className="bg-white border border-[#e0ddd0] rounded p-6 hover:shadow-lg transition bibliophilic-hover"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-grow">
                        {edition.publisher && (
                          <Link
                            href={`/publishers-series/${edition.publisher.id}`}
                            className="block text-xl font-serif font-bold text-[#4f4a3d] hover:underline mb-1"
                            style={{ fontFamily: "var(--font-serif)" }}
                          >
                            {edition.publisher.name}
                          </Link>
                        )}
                        <Link href={`/edition/${edition.id}`} className="block mb-1">
                          <h3
                            className="text-sm font-sans font-normal text-[#8b6f47] hover:underline"
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: "1rem",
                              lineHeight: "1.5rem",
                              fontWeight: 400,
                            }}
                          >
                            {edition.title}
                          </h3>
                        </Link>
                        {edition.publication_year && (
                          <p className="text-[#6b6b6b] mb-1" style={{ fontSize: "1rem", lineHeight: "1.5rem" }}>
                            Publishing year: {edition.publication_year}
                          </p>
                        )}
                        {edition.language && (
                          <p className="text-sm text-[#6b6b6b] mb-1" style={{ fontSize: "1rem", lineHeight: "1.5rem" }}>
                            Language: {edition.language}
                          </p>
                        )}
                        {edition.series && (
                          <p className="text-sm text-[#6b6b6b] italic">
                            Series: {edition.series.name}
                          </p>
                        )}
                        <p className="mt-4 text-sm text-[#6b6b6b]">
                          Sub-editions: {subEditionCount}
                        </p>
                      </div>
                      {firstPhoto && (
                        <Link href={`/edition/${edition.id}`} className="flex-shrink-0">
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${firstPhoto.storage_path}`}
                            alt={edition.title}
                            className="w-24 h-32 object-cover rounded border border-[#e0ddd0]"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

