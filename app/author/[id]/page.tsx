import { supabase } from "@/utils/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getAuthor(id: number) {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getWorksByAuthor(authorId: number) {
  // First, get all work_ids for this author
  const { data: workAuthors, error: workAuthorsError } = await supabase
    .from("work_authors")
    .select("work_id")
    .eq("author_id", authorId);

  if (workAuthorsError || !workAuthors || workAuthors.length === 0) {
    if (workAuthorsError) {
      console.error("Error fetching work_authors:", workAuthorsError);
    }
    return [];
  }

  // Get the work IDs
  const workIds = workAuthors.map((wa) => wa.work_id);

  // Fetch the works
  const { data: works, error: worksError } = await supabase
    .from("works")
    .select(`
      id,
      original_title,
      english_title,
      original_publication_year,
      original_language
    `)
    .in("id", workIds)
    .order("original_title", { ascending: true });

  if (worksError) {
    console.error("Error fetching works:", worksError);
    return [];
  }

  return works || [];
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const resolvedParams = params instanceof Promise ? await params : params;
  const author = await getAuthor(parseInt(resolvedParams.id));
  
  if (!author) {
    notFound();
  }

  const works = await getWorksByAuthor(author.id);

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto">
        {/* Author Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#8b6f47] mb-2">
            {author.name}
          </h1>
          {author.wiki_link && (
            <a
              href={author.wiki_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b6f47] hover:underline inline-block mt-2"
            >
              View reference source →
            </a>
          )}
        </div>

        {/* Works List */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-[#8b6f47] mb-6">
            Works ({works.length})
          </h2>

          {works.length === 0 ? (
            <div className="bg-white border border-[#e0ddd0] rounded p-8 text-center text-[#6b6b6b]">
              No works found for this author
            </div>
          ) : (
            <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f9f8f0] border-b border-[#e0ddd0]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                        Original Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                        English Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                        Publication Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0ddd0]">
                    {works.map((work: any) => (
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
                          {work.original_publication_year || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

