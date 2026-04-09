import { supabase } from "@/utils/supabase";
import { Work } from "@/types/database";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

async function getWorks(sortBy?: string): Promise<any[]> {
  // Get works
  const { data: worksData, error: worksError } = await supabase
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
    .order(sortBy === "sort_title" ? "sort_title" : "original_title", { ascending: true })
    .limit(1000);

  if (worksError) {
    console.error("Error fetching works:", worksError);
    return [];
  }

  // Get edition counts
  const workIds = (worksData || []).map(w => w.id);
  const { data: countsData, error: countsError } = await supabase
    .from("editions")
    .select("work_id")
    .in("work_id", workIds);

  if (countsError) {
    console.error("Error fetching edition counts:", countsError);
  }

  // Count editions per work
  const editionCounts: Record<number, number> = {};
  (countsData || []).forEach(edition => {
    editionCounts[edition.work_id] = (editionCounts[edition.work_id] || 0) + 1;
  });

  // Add counts to works
  const works = (worksData || []).map(work => ({
    ...work,
    edition_count: editionCounts[work.id] || 0
  }));

  return works;
}

export default async function TitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }> | { sort?: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const works = await getWorks(params.sort);

  // Group works by first letter
  const groupedWorks: Record<string, any[]> = {};
  works.forEach(work => {
    let titleToUse = work.original_title || '';
    
    // Use sort_title if available and if that's what we're sorting by
    if (params.sort === 'sort_title' && work.sort_title) {
      titleToUse = work.sort_title;
    }
    
    const firstLetter = (titleToUse.charAt(0) || '').toUpperCase();
    if (!firstLetter) return; // Skip if no letter
    
    if (!groupedWorks[firstLetter]) {
      groupedWorks[firstLetter] = [];
    }
    groupedWorks[firstLetter].push(work);
  });

  // Sort letters
  const sortedLetters = Object.keys(groupedWorks).sort();

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">Titles</h1>

      <div className="mb-8">
        <SearchBox />
      </div>

      <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
        <div className="p-6 border-b border-[#e0ddd0]">
          <h2 className="text-2xl font-serif text-[#8b6f47]">
            All Titles ({works.length})
          </h2>
          <div className="mt-4">
            <span className="text-sm text-[#6b6b6b] mr-2">Sort by:</span>
            <Link
              href="/titles"
              className={`text-sm ${!params.sort || params.sort === 'original_title' ? 'text-[#8b6f47] font-medium' : 'text-[#6b6b6b] hover:underline'}`}
            >
              Original Title
            </Link>
            <span className="text-[#6b6b6b] mx-2">|</span>
            <Link
              href="/titles?sort=sort_title"
              className={`text-sm ${params.sort === 'sort_title' ? 'text-[#8b6f47] font-medium' : 'text-[#6b6b6b] hover:underline'}`}
            >
              Sort Title
            </Link>
          </div>
        </div>

        {works.length === 0 ? (
          <div className="p-8 text-center text-[#6b6b6b]">
            No titles found
          </div>
        ) : (
          <div className="p-6" style={{ columnCount: 3, columnGap: '2rem' }}>
            {sortedLetters.map(letter => (
              <div key={letter} className="mb-8" style={{ breakInside: 'avoid' }}>
                <h3 className="text-2xl font-serif text-[#8b6f47] mb-4 border-b border-[#e0ddd0] pb-2">
                  {letter}
                </h3>
                <ul className="list-disc list-inside space-y-3">
                  {groupedWorks[letter].map((work) => {
                    const authors = (work as any).work_authors?.map((wa: any) => wa.author) || [];
                    const authorNames = authors.map((a: any) => a.name).join(", ");
                    const hasEnglishTitle = work.english_title && work.english_title !== work.original_title;

                    return (
                      <li key={work.id} className="mb-4">
                        <div className="mb-2">
                          <Link
                            href={`/titles/${work.id}`}
                            className="text-[#8b6f47] hover:underline font-medium text-lg"
                          >
                            {work.original_title}
                          </Link>
                          {authorNames && (
                            <span className="text-[#6b6b6b]"> by </span>
                          )}
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
                          <span className="text-[#6b6b6b] ml-2">
                            ({work.edition_count} edition{work.edition_count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {hasEnglishTitle && (
                          <div className="text-[#6b6b6b] italic text-sm ml-6 mt-1">
                            {work.english_title}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

