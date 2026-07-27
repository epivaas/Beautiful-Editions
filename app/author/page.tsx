import { supabase } from "@/utils/supabase";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

interface AuthorSummary {
  id: number;
  name: string;
  work_count: number;
  edition_count: number;
}

function getLastName(name?: string | null) {
  const trimmed = name?.trim() || "";

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes(",")) {
    const [surname] = trimmed.split(",").map((part) => part.trim());
    return surname || trimmed;
  }

  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] || trimmed;
}

async function getAuthors(): Promise<AuthorSummary[]> {
  const { data: authorsData, error: authorsError } = await supabase
    .from("authors")
    .select("id, name")
    .order("name", { ascending: true });

  if (authorsError) {
    console.error("Error fetching authors:", authorsError);
    return [];
  }

  const authorIds = (authorsData || []).map((author) => author.id);

  const { data: workAuthorsData, error: workAuthorsError } = await supabase
    .from("work_authors")
    .select("author_id, work_id")
    .in("author_id", authorIds);

  if (workAuthorsError) {
    console.error("Error fetching work authors:", workAuthorsError);
  }

  const { data: editionsData, error: editionsError } = await supabase
    .from("editions")
    .select("work_id");

  if (editionsError) {
    console.error("Error fetching editions:", editionsError);
  }

  const worksByAuthor = new Map<number, Set<number>>();
  (workAuthorsData || []).forEach(({ author_id, work_id }) => {
    if (!worksByAuthor.has(author_id)) {
      worksByAuthor.set(author_id, new Set());
    }
    worksByAuthor.get(author_id)?.add(work_id);
  });

  const editionCountsByWork = new Map<number, number>();
  (editionsData || []).forEach(({ work_id }) => {
    editionCountsByWork.set(work_id, (editionCountsByWork.get(work_id) || 0) + 1);
  });

  return (authorsData || []).map((author) => {
    const workIds = worksByAuthor.get(author.id) || new Set<number>();
    const editionCount = Array.from(workIds).reduce((total, workId) => {
      return total + (editionCountsByWork.get(workId) || 0);
    }, 0);

    return {
      id: author.id,
      name: author.name,
      work_count: workIds.size,
      edition_count: editionCount,
    };
  });
}

export default async function AuthorsPage() {
  const authors = await getAuthors();

  const groupedAuthors: Record<string, AuthorSummary[]> = {};

  authors.forEach((author) => {
    const lastName = getLastName(author.name);
    const letter = (lastName.charAt(0) || "#").toUpperCase();

    if (!groupedAuthors[letter]) {
      groupedAuthors[letter] = [];
    }

    groupedAuthors[letter].push(author);
  });

  const sortedLetters = Object.keys(groupedAuthors).sort((a, b) => a.localeCompare(b));

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">Authors</h1>

      <div className="mb-8">
        <SearchBox />
      </div>

      <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
        <div className="p-6 border-b border-[#e0ddd0]">
          <h2 className="text-2xl font-serif text-[#8b6f47]">
            All Authors ({authors.length})
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Grouped by surname with the number of works and editions.
          </p>
        </div>

        {authors.length === 0 ? (
          <div className="p-8 text-center text-[#6b6b6b]">
            No authors found
          </div>
        ) : (
          <div className="p-6" style={{ columnCount: 3, columnGap: "2rem" }}>
            {sortedLetters.map((letter) => (
              <div key={letter} className="mb-8" style={{ breakInside: "avoid" }}>
                <h3 className="text-2xl font-serif text-[#8b6f47] mb-4 border-b border-[#e0ddd0] pb-2">
                  {letter}
                </h3>
                <ul className="space-y-3">
                  {groupedAuthors[letter]
                    .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)))
                    .map((author) => (
                      <li key={author.id}>
                        <div className="mb-1">
                          <Link
                            href={`/author/${author.id}`}
                            className="text-[#8b6f47] hover:underline font-medium"
                          >
                            {author.name}
                          </Link>
                        </div>
                        <div className="text-sm text-[#6b6b6b]">
                          {author.work_count} title{author.work_count !== 1 ? "s" : ""}, {author.edition_count} edition{author.edition_count !== 1 ? "s" : ""}
                        </div>
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
