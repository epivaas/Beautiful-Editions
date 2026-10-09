import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { fetchAllRows } from "@/utils/supabasePagination";
import type { EditionSearchRow } from "./search";

const REVALIDATE = 3600;

type EditionBase = {
  id: number;
  title: string;
  publication_year: number | null;
  language: string | null;
  binding_type: string | null;
  slipcase: boolean | null;
  is_limited_edition: boolean | null;
  series_id: number | null;
  publisher_id: number;
};
type WorkLink = {
  edition_id: number;
  work: { original_title: string; english_title: string | null; work_authors: { author: { name: string } | null }[] | null } | null;
};
type Illustrator = { edition_id: number; contributor: { name: string } | null };
type LimitedSub = { edition_id: number };
type PhotoRow = { edition_id: number | null; sub_edition: { edition_id: number } | null };

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * Every edition with what the detailed search filters on. Fetched as flat lists and joined here:
 * one nested query over all editions runs into the statement timeout.
 */
export const getEditionIndex = unstable_cache(
  async (): Promise<EditionSearchRow[]> => {
    const [editions, links, illustrators, limited, photos, publishers] = await Promise.all([
      fetchAllRows(() =>
        supabase
          .from("editions")
          .select("id, title, publication_year, language, binding_type, slipcase, is_limited_edition, series_id, publisher_id")
          .order("id")
      ),
      fetchAllRows(() =>
        supabase
          .from("work_editions")
          .select("id, edition_id, work:works ( original_title, english_title, work_authors ( author:authors ( name ) ) )")
          .order("id")
      ),
      fetchAllRows(() =>
        supabase
          .from("edition_contributors")
          .select("edition_id, contributor_id, contributor:contributors ( name )")
          .eq("role", "Illustrator")
          .order("edition_id")
          .order("contributor_id")
      ),
      fetchAllRows(() => supabase.from("sub_editions").select("id, edition_id").eq("is_limited_edition", true).order("id")),
      fetchAllRows(() => supabase.from("photos").select("id, edition_id, sub_edition:sub_editions ( edition_id )").order("id")),
      supabase.from("publishers").select("id, name"),
    ]);
    for (const r of [editions, links, illustrators, limited, photos]) if (r.error) console.error("Edition index:", r.error);

    const worksBy = new Map<number, WorkLink["work"][]>();
    for (const l of links.data as unknown as WorkLink[]) if (l.work) push(worksBy, l.edition_id, l.work);
    const illustratorsBy = new Map<number, string[]>();
    for (const i of illustrators.data as unknown as Illustrator[]) if (i.contributor) push(illustratorsBy, i.edition_id, i.contributor.name.trim());
    const limitedEditions = new Set((limited.data as unknown as LimitedSub[]).map((s) => s.edition_id));
    const photographed = new Set(
      (photos.data as unknown as PhotoRow[]).map((p) => p.edition_id ?? p.sub_edition?.edition_id).filter((id): id is number => !!id)
    );
    const publisherBy = new Map((publishers.data ?? []).map((p) => [p.id as number, { id: p.id as number, name: (p.name as string).trim() }]));

    return (editions.data as unknown as EditionBase[]).map((e) => {
      const works = worksBy.get(e.id) ?? [];
      return {
        id: e.id,
        title: e.title,
        publisher: publisherBy.get(e.publisher_id) ?? null,
        seriesId: e.series_id,
        year: e.publication_year,
        language: e.language,
        binding: e.binding_type || null,
        illustrators: [...new Set(illustratorsBy.get(e.id) ?? [])],
        authors: [
          ...new Set(works.flatMap((w) => (w?.work_authors ?? []).map((wa) => wa.author?.name.trim()).filter((n): n is string => !!n))),
        ],
        workTitles: works.flatMap((w) => [w?.original_title, w?.english_title].filter((t): t is string => !!t)),
        limited: Boolean(e.is_limited_edition) || limitedEditions.has(e.id),
        slipcase: Boolean(e.slipcase),
        hasPhotos: photographed.has(e.id),
      };
    });
  },
  ["search-edition-index"],
  { revalidate: REVALIDATE, tags: ["search-edition-index"] }
);

export type SearchOptions = {
  publishers: { id: number; name: string }[];
  series: { id: number; name: string; publisherId: number | null }[];
};

/** Names for the Publisher and Series lists of the detailed search; which ones show depends on the criteria (facetCounts). */
export const getSearchOptions = unstable_cache(
  async (): Promise<SearchOptions> => {
    const [publishers, series] = await Promise.all([
      supabase.from("publishers").select("id, name").order("name"),
      supabase.from("series").select("id, name, publisher_id").order("name"),
    ]);
    return {
      publishers: (publishers.data ?? []).map((p) => ({ id: p.id, name: p.name.trim() })),
      series: (series.data ?? []).map((s) => ({ id: s.id, name: s.name.trim(), publisherId: s.publisher_id })),
    };
  },
  ["search-options-v2"],
  { revalidate: REVALIDATE, tags: ["search-options-v2"] }
);
