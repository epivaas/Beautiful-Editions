import { supabase } from "@/utils/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchAllRows } from "@/utils/supabasePagination";

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
  const { data: workAuthors, error: workAuthorsError } = await fetchAllRows(() =>
    supabase
      .from("work_authors")
      .select("work_id")
      .eq("author_id", authorId)
  );

  if (workAuthorsError || !workAuthors || workAuthors.length === 0) {
    if (workAuthorsError) {
      console.error("Error fetching work_authors:", workAuthorsError);
    }
    return [];
  }

  const workIds = workAuthors.map((wa) => wa.work_id);

  const { data: works, error: worksError } = await fetchAllRows(() =>
    supabase
      .from("works")
      .select(`
        id,
        original_title,
        english_title,
        original_publication_year,
        original_language
      `)
      .in("id", workIds)
      .order("original_title", { ascending: true })
  );

  if (worksError) {
    console.error("Error fetching works:", worksError);
    return [];
  }

  const { data: workEditions, error: editionsError } = await fetchAllRows(() =>
    supabase
      .from("work_editions")
      .select(`
        work_id,
        edition:editions (
          id,
          title,
          publication_year,
          publisher:publishers (id, name),
          series:series (id, name)
        )
      `)
      .in("work_id", workIds)
  );

  if (editionsError) {
    console.error("Error fetching editions:", editionsError);
  }

  const editionsByWork = new Map<number, any[]>();
  (workEditions || []).forEach((workEdition: any) => {
    if (!workEdition.edition) {
      return;
    }

    if (!editionsByWork.has(workEdition.work_id)) {
      editionsByWork.set(workEdition.work_id, []);
    }
    editionsByWork.get(workEdition.work_id)?.push(workEdition.edition);
  });

  editionsByWork.forEach((editions) => {
    editions.sort((a, b) => (b.publication_year || 0) - (a.publication_year || 0));
  });

  return (works || []).map((work: any) => ({
    ...work,
    editions: editionsByWork.get(work.id) || [],
  }));
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
            <div className="space-y-6">
              {works.map((work: any, index: number) => (
                <div key={work.id} className="pt-2">
                  {index > 0 && <div className="border-t-2 border-[#d8cfbe] mb-6" />}
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-3">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={`/titles/${work.id}`}
                        className="text-[#8b6f47] hover:underline font-semibold text-2xl tracking-wide"
                      >
                        {work.original_title}
                      </Link>
                      {work.english_title && (
                        <span className="text-[#6b6b6b] italic font-serif">
                          {"\u00a0"}({work.english_title})
                        </span>
                      )}
                      </div>
                      {work.original_publication_year && (
                        <div className="text-sm text-[#6b6b6b] mt-2">
                          Originally published: {work.original_publication_year}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[#8b6f47] whitespace-nowrap">
                      {work.editions.length} edition{work.editions.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {work.editions.length === 0 ? (
                    <div className="text-sm text-[#6b6b6b] pl-3 border-l border-[#e0ddd0]">
                      No editions available for this work.
                    </div>
                  ) : (
                    <div className="pl-3 md:pl-4 border-l border-[#e0ddd0] space-y-2">
                      {work.editions.map((edition: any) => (
                        <div key={edition.id} className="py-2">
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <Link
                                href={`/edition/${edition.id}`}
                                className="text-[#4f4a3d] hover:underline font-medium"
                              >
                                {edition.title}
                              </Link>
                              <div className="text-sm text-[#8b6f47] flex flex-wrap items-center gap-x-3">
                                {edition.publisher?.name && <span>{"\u00a0"}{edition.publisher.name}</span>}
                                {edition.series?.name && (
                                  <span className="italic">{"\u00a0"}{edition.series.name}</span>
                                )}
                              </div>
                            </div>
                            {edition.publication_year && (
                              <div className="text-sm text-[#6b6b6b] font-medium whitespace-nowrap">
                                {edition.publication_year}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

