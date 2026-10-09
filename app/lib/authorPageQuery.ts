import { supabase } from "@/utils/supabase";
import { fetchAllRows, fetchAllRowsInChunks } from "@/utils/supabasePagination";
import type { AuthorEditionLink, AuthorWork } from "./authorPage";

type LinkRow = { id: number; work_id: number; edition_id: number; edition: { publisher: { id: number; name: string } | null } | null };

/** An author with their works and every edition of those works. Flat queries, joined here. */
export async function getAuthorPage(id: number) {
  const { data: author, error } = await supabase.from("authors").select("id, name, wiki_link").eq("id", id).maybeSingle();
  if (error) console.error("Error fetching author:", error);
  if (!author) return null;

  const { data: workLinks } = await fetchAllRows(() =>
    supabase.from("work_authors").select("work_id").eq("author_id", id).order("work_id")
  );
  const workIds = [...new Set(workLinks.map((l) => l.work_id as number))];
  if (workIds.length === 0) return { author, works: [] as AuthorWork[], links: [] as AuthorEditionLink[] };

  const [works, links] = await Promise.all([
    fetchAllRowsInChunks(workIds, (chunk) =>
      supabase
        .from("works")
        .select("id, original_title, english_title, original_publication_year, sort_title")
        .in("id", chunk)
        .order("id")
    ),
    fetchAllRowsInChunks(workIds, (chunk) =>
      supabase
        .from("work_editions")
        .select("id, work_id, edition_id, edition:editions ( publisher:publishers ( id, name ) )")
        .in("work_id", chunk)
        .order("id")
    ),
  ]);
  if (works.error) console.error("Error fetching author works:", works.error);
  if (links.error) console.error("Error fetching author editions:", links.error);

  return {
    author,
    works: works.data as AuthorWork[],
    links: (links.data as unknown as LinkRow[]).map((l) => ({
      workId: l.work_id,
      editionId: l.edition_id,
      publisher: l.edition?.publisher ?? null,
    })),
  };
}
