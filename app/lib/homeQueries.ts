import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { fetchAllRows } from "@/utils/supabasePagination";
import { EDITION_CARD_SELECT, getTitlePage } from "./titlePageQuery";
import { collectPhotos, sortEditions, type TitleEditionRow } from "./titlePage";
import { getPublisherList, getTitleList } from "./overviewQueries";
import {
  activeSpotlight,
  isoDate,
  mergeRecent,
  periodIndex,
  pickForPeriod,
  recentlyShown,
  seededShuffle,
  weekIndex,
  type SpotlightRow,
} from "./home";

const REVALIDATE = 3600;
const RECENT_POOL = 120;
const RECENT_MONTHS = 3;
const SPOTLIGHT_MIN_EDITIONS = 3;

/**
 * "What's new": editions added in the last three months (editions.created_at), topped up with the
 * highest ids while there are fewer than four. Editions from before October 2026 have no created_at.
 */
export const getRecentEditions = unstable_cache(
  async (): Promise<TitleEditionRow[]> => {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - RECENT_MONTHS);
    const [recent, newest] = await Promise.all([
      supabase
        .from("editions")
        .select(EDITION_CARD_SELECT)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(RECENT_POOL),
      supabase.from("editions").select(EDITION_CARD_SELECT).order("id", { ascending: false }).limit(RECENT_POOL),
    ]);
    if (recent.error) console.error("Error fetching recent editions:", recent.error);
    if (newest.error) console.error("Error fetching newest editions:", newest.error);
    return mergeRecent(
      (recent.data ?? []) as unknown as TitleEditionRow[],
      (newest.data ?? []) as unknown as TitleEditionRow[],
      4
    );
  },
  ["home-recent-v2"],
  { revalidate: REVALIDATE, tags: ["home-recent"] }
);

/** Planned and pinned spotlights; a short cache so a new row by Eric shows up within minutes. */
const getSpotlightRows = unstable_cache(
  async (): Promise<SpotlightRow[]> => {
    const { data, error } = await supabase
      .from("spotlights")
      .select("id, kind, work_id, publisher_id, starts_on, ends_on, text")
      .order("starts_on", { ascending: false })
      .limit(500);
    if (error) {
      console.error("Error fetching spotlights:", error);
      return [];
    }
    return (data ?? []) as SpotlightRow[];
  },
  ["home-spotlights"],
  { revalidate: 300, tags: ["home-spotlights"] }
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
  /** Text from the spotlights table, if any. */
  text: string | null;
};

/**
 * Title in the spotlight: a planned or pinned row for today wins; otherwise a weekly pick among titles
 * with at least 3 editions and photos, skipping titles planned in the last eight weeks.
 */
export async function getTitleSpotlight(now: Date): Promise<TitleSpotlight | null> {
  const today = isoDate(now);
  const [titles, index, rows] = await Promise.all([getTitleList(), getPhotoIndex(), getSpotlightRows()]);
  const planned = activeSpotlight(rows, "title", today);

  let id = planned?.work_id ?? null;
  if (id === null) {
    const withPhotos = new Set(index.works);
    const recent = recentlyShown(rows, "title", today);
    const eligible = titles
      .filter((t) => t.editions >= SPOTLIGHT_MIN_EDITIONS && withPhotos.has(t.id))
      .map((t) => t.id)
      .sort((a, b) => a - b);
    const fresh = eligible.filter((t) => !recent.has(t));
    id = pickForPeriod(fresh.length > 0 ? fresh : eligible, weekIndex(now));
  }
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
    text: planned?.text ?? null,
  };
}

export type PublisherSpotlight = {
  publisher: { id: number; name: string; titles: number; editions: number; limitedEditions: number };
  editions: TitleEditionRow[];
  /** Text from the spotlights table, if any. */
  text: string | null;
};

const NO_ROWS = { data: [] as unknown[], error: null };

/**
 * Publisher in the spotlight: a planned or pinned row for today wins; otherwise a pick every two weeks
 * among publishers with at least 3 photographed editions, skipping publishers planned in the last eight weeks.
 */
export async function getPublisherSpotlight(now: Date): Promise<PublisherSpotlight | null> {
  const today = isoDate(now);
  const [publishers, index, rows] = await Promise.all([getPublisherList(), getPhotoIndex(), getSpotlightRows()]);
  const planned = activeSpotlight(rows, "publisher", today);
  const period = periodIndex(now, 2);

  let publisher = planned ? (publishers.find((p) => p.id === planned.publisher_id) ?? null) : null;
  if (!publisher) {
    const recent = recentlyShown(rows, "publisher", today);
    const eligible = publishers
      .filter((p) => (index.editionsByPublisher[p.id]?.length ?? 0) >= SPOTLIGHT_MIN_EDITIONS)
      .sort((a, b) => a.id - b.id);
    const fresh = eligible.filter((p) => !recent.has(p.id));
    publisher = pickForPeriod(fresh.length > 0 ? fresh : eligible, period);
  }
  if (!publisher) return null;

  // Three photographed editions, fixed for the period; a planned publisher without enough photos
  // is topped up with its newest editions
  const ids = seededShuffle(index.editionsByPublisher[publisher.id] ?? [], period).slice(0, 3);
  const [photographed, newest] = await Promise.all([
    ids.length > 0 ? supabase.from("editions").select(EDITION_CARD_SELECT).in("id", ids) : Promise.resolve(NO_ROWS),
    ids.length < 3
      ? supabase
          .from("editions")
          .select(EDITION_CARD_SELECT)
          .eq("publisher_id", publisher.id)
          .order("id", { ascending: false })
          .limit(3)
      : Promise.resolve(NO_ROWS),
  ]);
  if (photographed.error) console.error("Error fetching publisher spotlight:", photographed.error);
  if (newest.error) console.error("Error fetching publisher editions:", newest.error);
  const byId = new Map(((photographed.data ?? []) as unknown as TitleEditionRow[]).map((e) => [e.id, e]));
  const chosen = ids.map((id) => byId.get(id)).filter((e): e is TitleEditionRow => !!e);
  const editions = mergeRecent(chosen, (newest.data ?? []) as unknown as TitleEditionRow[], 3).slice(0, 3);

  return {
    publisher: {
      id: publisher.id,
      name: publisher.name,
      titles: publisher.titles,
      editions: publisher.editions,
      limitedEditions: publisher.limitedEditions,
    },
    editions,
    text: planned?.text ?? null,
  };
}
