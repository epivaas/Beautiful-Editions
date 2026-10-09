import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { fetchAllRows } from "@/utils/supabasePagination";
import { sortableYear, yearSpan } from "./overview";

// The lists change rarely; cache them for an hour so a page view doesn't fetch thousands of rows.
const REVALIDATE = 3600;

export type TitleListRow = {
  id: number;
  title: string;
  englishTitle: string | null;
  sortTitle: string;
  firstPublished: string | null;
  firstPublishedSort: number | null;
  authors: { id: number; name: string }[];
  editions: number;
};

export type AuthorListRow = { id: number; name: string; titles: number; editions: number };

export type PublisherListRow = {
  id: number;
  name: string;
  titles: number;
  editions: number;
  years: string | null;
  firstYear: number | null;
  lastYear: number | null;
};

export type SeriesListRow = PublisherListRow & { publisher: { id: number; name: string } | null };

export type PublisherWithLimited = PublisherListRow & { limitedEditions: number };

type WorkQueryRow = {
  id: number;
  original_title: string;
  english_title: string | null;
  sort_title: string | null;
  original_publication_year: string | null;
  work_authors: { author: { id: number; name: string } | null }[] | null;
  work_editions: { count: number }[] | null;
};

export const getTitleList = unstable_cache(
  async (): Promise<TitleListRow[]> => {
    const { data, error } = await fetchAllRows(() =>
      supabase
        .from("works")
        .select(
          "id, original_title, english_title, sort_title, original_publication_year, work_authors ( author:authors ( id, name ) ), work_editions ( count )"
        )
        .order("id", { ascending: true })
    );
    if (error) {
      console.error("Error fetching title list:", error);
      return [];
    }
    return (data as unknown as WorkQueryRow[]).map((w) => ({
      id: w.id,
      title: w.original_title,
      englishTitle: w.english_title && w.english_title !== w.original_title ? w.english_title : null,
      sortTitle: w.sort_title || w.original_title,
      firstPublished: w.original_publication_year,
      firstPublishedSort: sortableYear(w.original_publication_year),
      authors: (w.work_authors ?? []).map((wa) => wa.author).filter((a): a is { id: number; name: string } => a !== null),
      editions: w.work_editions?.[0]?.count ?? 0,
    }));
  },
  ["overview-titles"],
  { revalidate: REVALIDATE, tags: ["overview-titles"] }
);

type AuthorQueryRow = {
  id: number;
  name: string;
  work_authors: { work: { id: number; work_editions: { edition_id: number }[] | null } | null }[] | null;
};

export const getAuthorList = unstable_cache(
  async (): Promise<AuthorListRow[]> => {
    const { data, error } = await fetchAllRows(() =>
      supabase
        .from("authors")
        .select("id, name, work_authors ( work:works ( id, work_editions ( edition_id ) ) )")
        .order("id", { ascending: true })
    );
    if (error) {
      console.error("Error fetching author list:", error);
      return [];
    }
    return (data as unknown as AuthorQueryRow[]).map((a) => {
      const works = (a.work_authors ?? []).map((wa) => wa.work).filter((w) => w !== null);
      return {
        id: a.id,
        name: a.name.trim(),
        titles: new Set(works.map((w) => w.id)).size,
        editions: new Set(works.flatMap((w) => (w.work_editions ?? []).map((we) => we.edition_id))).size,
      };
    });
  },
  ["overview-authors"],
  { revalidate: REVALIDATE, tags: ["overview-authors"] }
);

type EditionAggRow = {
  id: number;
  publisher_id: number | null;
  series_id: number | null;
  publication_year: number | null;
  work_editions: { work_id: number }[] | null;
};

// Nested relations are capped at 1,000 rows (the Folio Society alone has more editions),
// so editions are fetched as a flat, paginated list and counted here.
async function getEditionAggregates() {
  const { data, error } = await fetchAllRows(() =>
    supabase
      .from("editions")
      .select("id, publisher_id, series_id, publication_year, work_editions ( work_id )")
      .order("id", { ascending: true })
  );
  if (error) console.error("Error fetching editions for overviews:", error);

  const tally = (key: "publisher_id" | "series_id") => {
    const map = new Map<number, { editions: number; works: Set<number>; years: (number | null)[] }>();
    for (const e of (data as unknown as EditionAggRow[]) ?? []) {
      const id = e[key];
      if (id === null) continue;
      const entry = map.get(id) ?? { editions: 0, works: new Set<number>(), years: [] };
      entry.editions++;
      for (const we of e.work_editions ?? []) entry.works.add(we.work_id);
      entry.years.push(e.publication_year);
      map.set(id, entry);
    }
    return map;
  };

  return { byPublisher: tally("publisher_id"), bySeries: tally("series_id") };
}

function counted(entry: { editions: number; works: Set<number>; years: (number | null)[] } | undefined) {
  const years = entry?.years ?? [];
  const known = years.filter((y): y is number => y !== null);
  return {
    titles: entry?.works.size ?? 0,
    editions: entry?.editions ?? 0,
    years: yearSpan(years),
    firstYear: known.length ? Math.min(...known) : null,
    lastYear: known.length ? Math.max(...known) : null,
  };
}

// Limited sub-editions per publisher, from a flat list (a few hundred rows)
async function getLimitedByPublisher() {
  const { data, error } = await fetchAllRows(() =>
    supabase
      .from("sub_editions")
      .select("id, edition:editions ( publisher_id )")
      .eq("is_limited_edition", true)
      .order("id", { ascending: true })
  );
  if (error) console.error("Error fetching limited sub-editions:", error);
  const counts = new Map<number, number>();
  for (const row of (data as unknown as { edition: { publisher_id: number } | null }[]) ?? []) {
    const id = row.edition?.publisher_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export const getPublisherList = unstable_cache(
  async (): Promise<PublisherWithLimited[]> => {
    const [{ data, error }, aggregates, limited] = await Promise.all([
      supabase.from("publishers").select("id, name").order("id", { ascending: true }),
      getEditionAggregates(),
      getLimitedByPublisher(),
    ]);
    if (error) {
      console.error("Error fetching publishers:", error);
      return [];
    }
    return (data ?? []).map((p) => ({
      id: p.id,
      name: p.name.trim(),
      ...counted(aggregates.byPublisher.get(p.id)),
      limitedEditions: limited.get(p.id) ?? 0,
    }));
  },
  // v2: rows include limitedEditions
  ["overview-publishers-v2"],
  { revalidate: REVALIDATE, tags: ["overview-publishers"] }
);

export const getSeriesList = unstable_cache(
  async (): Promise<SeriesListRow[]> => {
    const [{ data, error }, aggregates] = await Promise.all([
      supabase.from("series").select("id, name, publisher:publishers ( id, name )").order("id", { ascending: true }),
      getEditionAggregates(),
    ]);
    if (error) {
      console.error("Error fetching series:", error);
      return [];
    }
    return (data as unknown as { id: number; name: string; publisher: { id: number; name: string } | null }[]).map((s) => ({
      id: s.id,
      name: s.name.trim(),
      publisher: s.publisher ? { id: s.publisher.id, name: s.publisher.name.trim() } : null,
      ...counted(aggregates.bySeries.get(s.id)),
    }));
  },
  ["overview-series"],
  { revalidate: REVALIDATE, tags: ["overview-series"] }
);
