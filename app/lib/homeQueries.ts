import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { fetchAllRows } from "@/utils/supabasePagination";
import { EDITION_CARD_SELECT, getTitlePage } from "./titlePageQuery";
import { collectPhotos, sortEditions, type TitleEditionRow } from "./titlePage";
import { getPublisherList, getTitleList } from "./overviewQueries";
import { periodIndex, pickForPeriod, seededShuffle, weekIndex } from "./home";

const REVALIDATE = 3600;
// Until editions have a created_at, the id is the order in which they were added
const RECENT_POOL = 120;
const SPOTLIGHT_MIN_EDITIONS = 3;

/** The most recently added editions (highest ids), for "What's new". */
export const getRecentEditions = unstable_cache(
  async (): Promise<TitleEditionRow[]> => {
    const { data, error } = await supabase
      .from("editions")
      .select(EDITION_CARD_SELECT)
      .order("id", { ascending: false })
      .limit(RECENT_POOL);
    if (error) {
      console.error("Error fetching recent editions:", error);
      return [];
    }
    return data as unknown as TitleEditionRow[];
  },
  ["home-recent"],
  { revalidate: REVALIDATE, tags: ["home-recent"] }
);

type PhotoIndex = {
  /** Works with at least one photo on one of their editions or sub-editions. */
  works: number[];
  /** Per publisher: editions that have photos. */
  editionsByPublisher: Record<number, number[]>;
};

/** Which titles and publishers have photographed editions (only those can be in the spotlight). */
const getPhotoIndex = unstable_cache(
  async (): Promise<PhotoIndex> => {
    const { data: photos, error } = await fetchAllRows(() =>
      supabase.from("photos").select("id, edition_id, sub_edition:sub_editions ( edition_id )").order("id")
    );
    if (error) console.error("Error fetching photo index:", error);
    const editionIds = [
      ...new Set(
        ((photos ?? []) as unknown as { edition_id: number | null; sub_edition: { edition_id: number } | null }[])
          .map((p) => p.edition_id ?? p.sub_edition?.edition_id ?? null)
          .filter((id): id is number => id !== null)
      ),
    ];
    if (editionIds.length === 0) return { works: [], editionsByPublisher: {} };

    // A few dozen photographed editions: a short .in() list is fine here
    const { data: editions } = await supabase
      .from("editions")
      .select("id, publisher_id, work_editions ( work_id )")
      .in("id", editionIds);

    const works = new Set<number>();
    const editionsByPublisher: Record<number, number[]> = {};
    for (const e of (editions ?? []) as { id: number; publisher_id: number; work_editions: { work_id: number }[] }[]) {
      for (const we of e.work_editions ?? []) works.add(we.work_id);
      (editionsByPublisher[e.publisher_id] ??= []).push(e.id);
    }
    return { works: [...works].sort((a, b) => a - b), editionsByPublisher };
  },
  ["home-photo-index"],
  { revalidate: REVALIDATE, tags: ["home-photo-index"] }
);

export type TitleSpotlight = {
  work: { id: number; title: string; authors: string[] };
  editionCount: number;
  editions: TitleEditionRow[];
};

/** Title in the spotlight: changes every week, among titles with at least 3 editions and photos. */
export async function getTitleSpotlight(now: Date): Promise<TitleSpotlight | null> {
  const [titles, index] = await Promise.all([getTitleList(), getPhotoIndex()]);
  const withPhotos = new Set(index.works);
  const eligible = titles
    .filter((t) => t.editions >= SPOTLIGHT_MIN_EDITIONS && withPhotos.has(t.id))
    .map((t) => t.id)
    .sort((a, b) => a - b);
  const id = pickForPeriod(eligible, weekIndex(now));
  if (id === null) return null;

  const work = await getTitlePage(id);
  if (!work) return null;
  const editions = sortEditions(work);
  // Editions with photos first (newest first), then the rest
  const shown = [...editions]
    .sort(
      (a, b) =>
        Number(collectPhotos([b]).length > 0) - Number(collectPhotos([a]).length > 0) ||
        (b.publication_year ?? 0) - (a.publication_year ?? 0)
    )
    .slice(0, 3);

  return {
    work: {
      id: work.id,
      title: work.original_title,
      authors: (work.work_authors ?? []).map((wa) => wa.author?.name).filter((n): n is string => !!n),
    },
    editionCount: editions.length,
    editions: shown,
  };
}

export type PublisherSpotlight = {
  publisher: { id: number; name: string; titles: number; editions: number; limitedEditions: number };
  editions: TitleEditionRow[];
};

/** Publisher in the spotlight: changes every two weeks, among publishers with at least 3 photographed editions. */
export async function getPublisherSpotlight(now: Date): Promise<PublisherSpotlight | null> {
  const [publishers, index] = await Promise.all([getPublisherList(), getPhotoIndex()]);
  const eligible = publishers
    .filter((p) => (index.editionsByPublisher[p.id]?.length ?? 0) >= SPOTLIGHT_MIN_EDITIONS)
    .sort((a, b) => a.id - b.id);
  const period = periodIndex(now, 2);
  const publisher = pickForPeriod(eligible, period);
  if (!publisher) return null;

  // Three photographed editions, fixed for the period
  const ids = seededShuffle(index.editionsByPublisher[publisher.id], period).slice(0, 3);
  const { data, error } = await supabase.from("editions").select(EDITION_CARD_SELECT).in("id", ids);
  if (error) console.error("Error fetching publisher spotlight:", error);
  const byId = new Map(((data ?? []) as unknown as TitleEditionRow[]).map((e) => [e.id, e]));

  return {
    publisher: {
      id: publisher.id,
      name: publisher.name,
      titles: publisher.titles,
      editions: publisher.editions,
      limitedEditions: publisher.limitedEditions,
    },
    editions: ids.map((id) => byId.get(id)).filter((e): e is TitleEditionRow => !!e),
  };
}
