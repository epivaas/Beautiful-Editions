import { supabase } from "@/utils/supabase";
import { Work } from "@/types/database";
import { fetchAllRows } from "@/utils/supabasePagination";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

interface AuthorLink {
  id: number;
  name: string;
}

type TitleWork = Work & {
  work_authors?: { author: AuthorLink }[];
};

type TitleWorkWithCount = TitleWork & {
  edition_count: number;
};

async function getWorks(): Promise<TitleWorkWithCount[]> {
  // Get works
  const { data: worksData, error: worksError } = await fetchAllRows(() =>
    supabase
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
      .order("sort_title", {
        ascending: true,
        nullsFirst: false,
      })
  );

  if (worksError) {
    console.error("Error fetching works:", worksError);
    return [];
  }

  // Get edition counts through the junction table
  const fetchedWorks = (worksData || []) as TitleWork[];
  const workIds = fetchedWorks.map((work) => work.id);
  const { data: countsData, error: countsError } = await fetchAllRows(() =>
    supabase
      .from("work_editions")
      .select("work_id")
      .in("work_id", workIds)
  );

  if (countsError) {
    console.error("Error fetching edition counts:", countsError);
  }

  // Count editions per work
  const editionCounts: Record<number, number> = {};
  (countsData || []).forEach((link) => {
    editionCounts[link.work_id] = (editionCounts[link.work_id] || 0) + 1;
  });

  // Add counts to works
  const works: TitleWorkWithCount[] = fetchedWorks.map((work) => ({
    ...work,
    edition_count: editionCounts[work.id] || 0
  }));

  return works;
}

export default async function TitlesPage() {
  const works = await getWorks();

  // Group works by first letter
  const groupedWorks: Record<string, TitleWorkWithCount[]> = {};
  works.forEach((work) => {
    const titleToUse = work.sort_title || work.original_title || '';
    
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
                    const authors = work.work_authors?.map((workAuthor) => workAuthor.author) || [];
                    const authorNames = authors.map((author) => author.name).join(", ");
                    const displayedTitle = work.sort_title || work.original_title;
                    const hasOriginalTitle = displayedTitle !== work.original_title;
                    const hasEnglishTitle = work.english_title && work.english_title !== displayedTitle;

                    return (
                      <li key={work.id} className="mb-4">
                        <div className="mb-2">
                          <Link
                            href={`/titles/${work.id}`}
                            className="text-[#8b6f47] hover:underline font-medium text-lg"
                          >
                            {displayedTitle}
                          </Link>
                          {authorNames && (
                            <span className="text-[#6b6b6b]"> by </span>
                          )}
                          {authors.map((author, index) => (
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
                            {" "}
                            ({work.edition_count} edition{work.edition_count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {hasOriginalTitle && (
                          <div className="text-[#6b6b6b] text-sm ml-6 mt-1">
                            {work.original_title}
                          </div>
                        )}
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

