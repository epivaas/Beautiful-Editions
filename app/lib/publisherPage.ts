// Pure helpers for the publisher page (/publishers-series/[id]): titles grouped per publication year.
// No Supabase import, so they can be unit tested.

export type PublisherEdition = { id: number; year: number | null; workIds: number[]; illustrators: string[] };
export type PublisherWork = {
  id: number;
  title: string;
  englishTitle: string | null;
  sortTitle: string;
  authors: { id: number; name: string }[];
};

/** One title in one year: a title published again in another year is another row. */
export type PublisherTitleRow = {
  key: string;
  workId: number;
  year: number | null;
  title: string;
  englishTitle: string | null;
  sortTitle: string;
  authors: { id: number; name: string }[];
  illustrators: string[];
  editions: number;
  /** The edition when there is only one that year: the title then links straight to it. */
  editionId: number | null;
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function publisherTitleRows(editions: PublisherEdition[], works: PublisherWork[]): PublisherTitleRow[] {
  const workById = new Map(works.map((w) => [w.id, w]));
  const rows = new Map<string, PublisherTitleRow & { editionIds: number[] }>();
  for (const e of editions) {
    for (const workId of new Set(e.workIds)) {
      const work = workById.get(workId);
      if (!work) continue;
      const key = `${workId}-${e.year ?? "unknown"}`;
      const row =
        rows.get(key) ??
        {
          key,
          workId,
          year: e.year,
          title: work.title,
          englishTitle: work.englishTitle,
          sortTitle: work.sortTitle,
          authors: work.authors,
          illustrators: [],
          editions: 0,
          editionId: null,
          editionIds: [],
        };
      row.editionIds.push(e.id);
      for (const name of e.illustrators) if (!row.illustrators.includes(name)) row.illustrators.push(name);
      rows.set(key, row);
    }
  }
  return [...rows.values()].map(({ editionIds, ...row }) => ({
    ...row,
    editions: editionIds.length,
    editionId: editionIds.length === 1 ? editionIds[0] : null,
  }));
}

/** Newest year first (or oldest with "asc"), unknown years always last; A–Z within a year. */
export function sortTitleRows(rows: PublisherTitleRow[], dir: "asc" | "desc" = "desc") {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) =>
      (a.year === null ? 1 : 0) - (b.year === null ? 1 : 0) ||
      (a.year !== null && b.year !== null ? sign * (a.year - b.year) : 0) ||
      collator.compare(a.sortTitle, b.sortTitle) ||
      a.workId - b.workId
  );
}

/** Titles per known year, oldest first, for the year bar. */
export function yearCounts(rows: PublisherTitleRow[]) {
  const counts = new Map<number, number>();
  for (const r of rows) if (r.year !== null) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
  return [...counts].map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
}

/** The page (1-based) on which a year starts; 1 when the year is not in the list. */
export function pageOfYear(sorted: PublisherTitleRow[], year: number, size: number) {
  const i = sorted.findIndex((r) => r.year === year);
  return i < 0 ? 1 : Math.floor(i / size) + 1;
}

export type ListItem =
  | { kind: "year"; year: number | null; count: number; continued: boolean }
  | { kind: "row"; row: PublisherTitleRow };

/**
 * One page of rows with a heading before each year. A year that started on an earlier page gets its
 * heading again, marked "continued". `start` is the index of the page's first row in `sorted`.
 */
export function groupPage(sorted: PublisherTitleRow[], start: number, size: number): ListItem[] {
  const counts = new Map<number | null, number>();
  for (const r of sorted) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
  const items: ListItem[] = [];
  let previous: number | null | undefined = undefined;
  sorted.slice(start, start + size).forEach((row, i) => {
    if (i === 0 || row.year !== previous) {
      const continued = i === 0 && start > 0 && sorted[start - 1].year === row.year;
      items.push({ kind: "year", year: row.year, count: counts.get(row.year) ?? 0, continued });
    }
    items.push({ kind: "row", row });
    previous = row.year;
  });
  return items;
}

// Year bar (DESIGN.md, "Jaarbalk"): 20 px bars with 4 px between them; from about 50 years the card
// takes the full width and the bars get narrower; under 5 years there is no bar at all.
export const BAR_PITCH = 24;
export const FULL_WIDTH_FROM = 50;
export const MIN_YEARS = 5;
// A mono year label of 12 px ("2018") needs about this much room
const LABEL_ROOM = 36;

/**
 * Ticks under the year bar: every year when there is room, otherwise every 2, 5 or 10 years.
 * `pxPerYear` is the width one year gets on screen.
 */
export function yearTicks(first: number, last: number, pxPerYear: number) {
  const step = [1, 2, 5, 10, 20].find((s) => s * pxPerYear >= LABEL_ROOM) ?? 20;
  const ticks: number[] = [];
  for (let y = Math.ceil(first / step) * step; y <= last; y += step) ticks.push(y);
  return ticks;
}
