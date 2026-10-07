import { supabase } from "@/utils/supabase";
import { Work } from "@/types/database";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

type SearchWork = Work & {
  work_authors?: { author: { id: number; name: string } | null }[] | null;
};

type SearchWorkRelation = Work & {
  work_authors?: {
    author: { id: number; name: string } | { id: number; name: string }[] | null;
  }[] | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function normalizeSearchWork(work: SearchWorkRelation): SearchWork {
  return {
    ...work,
    work_authors: (work.work_authors || []).map((workAuthor) => ({
      author: firstRelation(workAuthor.author),
    })),
  };
}

async function searchWorks(searchQuery: string): Promise<SearchWork[]> {
  // Search in original_title, english_title, and authors
  const searchTerm = `%${searchQuery}%`;

  // First, search works by title
  const { data: worksByTitle, error: titleError } = await supabase
    .from("works")
    .select(`
      *,
      work_authors (
        author:authors (
          id,
          name
        )
      )
    `)
    .or(`original_title.ilike.${searchTerm},english_title.ilike.${searchTerm}`)
    .limit(50);
  if (titleError) {
    console.error("Error searching works by title:", titleError);
  }

  // Search by author name
  const { data: authors, error: authorError } = await supabase
    .from("authors")
    .select("id")
    .ilike("name", searchTerm)
    .limit(10);
  if (authorError) {
    console.error("Error searching authors:", authorError);
  }

  let worksByAuthor: SearchWork[] = [];
  if (authors && authors.length > 0) {
    const authorIds = authors.map((a) => a.id);
    const { data, error } = await supabase
      .from("work_authors")
      .select(`
        work_id,
        work:works (
          *,
          work_authors (
            author:authors (
              id,
              name
            )
          )
        )
      `)
      .in("author_id", authorIds)
      .limit(50);

    if (error) {
      console.error("Error finding works by author:", error);
    } else if (data) {
      worksByAuthor = (data as { work: SearchWorkRelation | SearchWorkRelation[] | null }[])
        .flatMap((item) => {
          const work = firstRelation(item.work);
          return work ? [normalizeSearchWork(work)] : [];
        });
    }
  }

  // Search editions by title
  const { data: editions, error: editionError } = await supabase
    .from("editions")
    .select("id")
    .ilike("title", searchTerm)
    .limit(20);
  if (editionError) {
    console.error("Error searching editions:", editionError);
  }

  let worksByEdition: SearchWork[] = [];
  if (editions && editions.length > 0) {
    const editionIds = editions.map((edition) => edition.id);
    const { data: workEditionLinks, error: workEditionError } = await supabase
      .from("work_editions")
      .select("work_id")
      .in("edition_id", editionIds);

    if (workEditionError) {
      console.error("Error finding works for editions:", workEditionError);
    } else if (workEditionLinks?.length) {
      const workIds = [...new Set(workEditionLinks.map((link) => link.work_id))];
      const { data, error } = await supabase
        .from("works")
        .select(`
          *,
          work_authors (
            author:authors (
              id,
              name
            )
          )
        `)
        .in("id", workIds)
        .limit(50);

      if (error) {
        console.error("Error fetching works for editions:", error);
      } else if (data) {
        worksByEdition = (data as SearchWorkRelation[]).map(normalizeSearchWork);
      }
    }
  }

  // Combine and deduplicate by work id
  const allWorks = [
    ...((worksByTitle || []) as SearchWorkRelation[]).map(normalizeSearchWork),
    ...worksByAuthor,
    ...worksByEdition,
  ];

  const uniqueWorks = Array.from(
    new Map(allWorks.map((work) => [work.id, work])).values()
  ).slice(0, 50);

  return uniqueWorks;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }> | { q?: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const query = params.q || "";
  const works = query ? await searchWorks(query) : [];

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">Search Titles</h1>

      <div className="mb-8">
        <SearchBox />
      </div>

      {query && (
        <div className="mb-6">
          <p className="text-[#6b6b6b]">
            {works.length > 0
              ? `Found ${works.length} result${works.length !== 1 ? "s" : ""} for "${query}"`
              : `No results found for "${query}"`}
          </p>
        </div>
      )}

      {works.length > 0 && (
        <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
          <div className="divide-y divide-[#e0ddd0]">
            {works.map((work) => {
              const authors =
                work.work_authors
                  ?.map((workAuthor) => workAuthor.author?.name)
                  .filter((name): name is string => Boolean(name))
                  .join(", ") || "Unknown";

              return (
                <Link
                  key={work.id}
                  href={`/titles/${work.id}`}
                  className="block p-6 hover:bg-[#fdfcf0] transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-serif text-[#8b6f47] mb-1">
                        {work.original_title}
                      </h3>
                      {work.english_title && (
                        <p className="text-[#6b6b6b] italic mb-1">
                          {work.english_title}
                        </p>
                      )}
                      <p className="text-[#6b6b6b]">{authors}</p>
                    </div>
                    {work.original_publication_year && (
                      <p className="text-[#8b6f47] font-medium">
                        {work.original_publication_year}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

