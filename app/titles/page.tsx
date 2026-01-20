import { supabase } from "@/utils/supabase";
import { Work } from "@/types/database";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import AlphabetNav from "@/components/AlphabetNav";
import SortableTableHeader from "@/components/SortableTableHeader";

async function getWorks(letter?: string, sortBy?: string, sortOrder?: string): Promise<any[]> {
  let query = supabase
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
    .limit(20);

  if (letter) {
    query = query.ilike("original_title", `${letter}%`);
  }

  // Default sorting - if sorting by author, we'll do it client-side
  let data, error;
  if (sortBy === "author") {
    // Fetch all data, we'll sort by author client-side
    const result = await query.order("original_title", { ascending: true });
    data = result.data;
    error = result.error;
  } else {
    const orderBy = sortBy || "original_title";
    const ascending = sortOrder !== "desc";
    const result = await query.order(orderBy, { ascending });
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error fetching works:", error);
    return [];
  }

  let works = (data || []);

  // Client-side sorting by author if needed
  if (sortBy === "author") {
    const ascending = sortOrder !== "desc";
    works = works.sort((a: any, b: any) => {
      const authorA = a.work_authors?.[0]?.author?.name || "";
      const authorB = b.work_authors?.[0]?.author?.name || "";
      return ascending 
        ? authorA.localeCompare(authorB)
        : authorB.localeCompare(authorA);
    });
  }

  return works;
}

export default async function TitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ letter?: string; sort?: string; order?: string }> | { letter?: string; sort?: string; order?: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const works = await getWorks(params.letter, params.sort, params.order);
  
  // Prepare params for SortableTableHeader (all string values)
  const headerParams: Record<string, string | undefined> = {
    letter: params.letter,
    sort: params.sort,
    order: params.order,
  };

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">Titles</h1>

      <div className="mb-8">
        <SearchBox />
      </div>

      <div className="mb-8">
        <AlphabetNav />
      </div>

      <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
        <div className="p-6 border-b border-[#e0ddd0]">
          <h2 className="text-2xl font-serif text-[#8b6f47]">
            {params.letter
              ? `Titles starting with "${params.letter.toUpperCase()}"`
              : "Titles"}
            {works.length > 0 && ` (${works.length})`}
          </h2>
        </div>

        {works.length === 0 ? (
          <div className="p-8 text-center text-[#6b6b6b]">
            No titles found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9f8f0] border-b border-[#e0ddd0]">
                <tr>
                  <SortableTableHeader
                    label="Original Title"
                    sortKey="original_title"
                    currentSort={params.sort}
                    currentOrder={params.order}
                    baseUrl="/titles"
                    params={headerParams}
                  />
                  <SortableTableHeader
                    label="English Title"
                    sortKey="english_title"
                    currentSort={params.sort}
                    currentOrder={params.order}
                    baseUrl="/titles"
                    params={headerParams}
                  />
                  <SortableTableHeader
                    label="Author"
                    sortKey="author"
                    currentSort={params.sort}
                    currentOrder={params.order}
                    baseUrl="/titles"
                    params={headerParams}
                  />
                  <SortableTableHeader
                    label="Publication Year"
                    sortKey="original_publication_year"
                    currentSort={params.sort}
                    currentOrder={params.order}
                    baseUrl="/titles"
                    params={headerParams}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0ddd0]">
                {works.map((work) => {
                  const authors = (work as any).work_authors?.map((wa: any) => wa.author) || [];

                  return (
                    <tr key={work.id} className="hover:bg-[#fdfcf0] transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/titles/${work.id}`}
                          className="text-[#8b6f47] hover:underline font-medium"
                        >
                          {work.original_title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#6b6b6b] italic">
                        {work.english_title || "—"}
                      </td>
                      <td className="px-6 py-4 text-[#6b6b6b]">
                        {authors.length > 0 ? (
                          <>
                            {authors.map((author: any, index: number) => (
                              <span key={author.id}>
                                <Link
                                  href={`/author/${author.id}`}
                                  className="text-[#8b6f47] hover:underline"
                                >
                                  {author.name}
                                </Link>
                                {index < authors.length - 1 && ", "}
                              </span>
                            ))}
                          </>
                        ) : (
                          "Unknown"
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#6b6b6b]">
                        {work.original_publication_year || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

