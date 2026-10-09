import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { fetchAllRows, fetchAllRowsInChunks } from "@/utils/supabasePagination";
import type { PublisherEdition, PublisherWork } from "./publisherPage";

type WorkRow = {
  id: number;
  original_title: string;
  english_title: string | null;
  sort_title: string | null;
  work_authors: { author: { id: number; name: string } | null }[] | null;
};

/**
 * Every edition of a publisher with its titles, authors and illustrators. Flat queries in chunks,
 * joined here: the Folio Society alone has about 3,500 editions. Cached for an hour per publisher.
 */
export const getPublisherTitles = unstable_cache(
  async (publisherId: number): Promise<{ editions: PublisherEdition[]; works: PublisherWork[] }> => {
    const editions = await fetchAllRows(() =>
      supabase.from("editions").select("id, publication_year").eq("publisher_id", publisherId).order("id")
    );
    if (editions.error) console.error("Publisher editions:", editions.error);
    const editionIds = editions.data.map((e) => e.id as number);
    if (editionIds.length === 0) return { editions: [], works: [] };

    const [links, illustrators] = await Promise.all([
      fetchAllRowsInChunks(editionIds, (chunk) =>
        supabase.from("work_editions").select("id, edition_id, work_id").in("edition_id", chunk).order("id")
      ),
      fetchAllRowsInChunks(editionIds, (chunk) =>
        supabase
          .from("edition_contributors")
          .select("edition_id, contributor_id, contributor:contributors ( name )")
          .eq("role", "Illustrator")
          .in("edition_id", chunk)
          .order("edition_id")
          .order("contributor_id")
      ),
    ]);
    if (links.error) console.error("Publisher work links:", links.error);
    if (illustrators.error) console.error("Publisher illustrators:", illustrators.error);

    const workIds = [...new Set(links.data.map((l) => l.work_id as number))];
    const works = await fetchAllRowsInChunks(workIds, (chunk) =>
      supabase
        .from("works")
        .select("id, original_title, english_title, sort_title, work_authors ( author:authors ( id, name ) )")
        .in("id", chunk)
        .order("id")
    );
    if (works.error) console.error("Publisher works:", works.error);

    const worksBy = new Map<number, number[]>();
    for (const l of links.data) worksBy.set(l.edition_id, [...(worksBy.get(l.edition_id) ?? []), l.work_id]);
    const illustratorsBy = new Map<number, string[]>();
    for (const row of illustrators.data as unknown as { edition_id: number; contributor: { name: string } | null }[]) {
      if (row.contributor) illustratorsBy.set(row.edition_id, [...(illustratorsBy.get(row.edition_id) ?? []), row.contributor.name.trim()]);
    }

    return {
      editions: editions.data.map((e) => ({
        id: e.id as number,
        year: (e.publication_year as number | null) ?? null,
        workIds: worksBy.get(e.id as number) ?? [],
        illustrators: illustratorsBy.get(e.id as number) ?? [],
      })),
      works: (works.data as unknown as WorkRow[]).map((w) => {
        const english = w.english_title?.trim() || null;
        return {
          id: w.id,
          title: w.original_title,
          englishTitle: english && english.toLowerCase() !== w.original_title.trim().toLowerCase() ? english : null,
          sortTitle: w.sort_title || w.original_title,
          authors: [
            ...new Map(
              (w.work_authors ?? []).flatMap((wa) => (wa.author ? [[wa.author.id, { id: wa.author.id, name: wa.author.name.trim() }] as const] : []))
            ).values(),
          ],
        };
      }),
    };
  },
  ["publisher-titles"],
  { revalidate: 3600, tags: ["publisher-titles"] }
);
