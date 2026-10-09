// Pure helpers for the publisher page (/publishers/[id]): titles grouped per publication year.
// No Supabase import, so they can be unit tested.
import { firstLetter, LETTERS } from "./overview";

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

export type GroupBy = "year" | "title" | "author";
export const GROUP_BYS: { key: GroupBy; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
];

export function isGroupBy(value: string | null | undefined): value is GroupBy {
  return GROUP_BYS.some((g) => g.key === value);
}

/** Only rows from `from` to `to` (both included); rows without a year drop out of a period. */
export function inRange(rows: PublisherTitleRow[], from: number | null, to: number | null) {
  if (from === null && to === null) return rows;
  const lo = Math.min(from ?? to!, to ?? from!);
  const hi = Math.max(from ?? to!, to ?? from!);
  return rows.filter((r) => r.year !== null && r.year >= lo && r.year <= hi);
}

/** A row under one heading. With Group by Author a title with two authors appears under both. */
export type GroupedRow = PublisherTitleRow & { group: string; groupLabel: string; rowKey: string };

const NO_AUTHOR = "No author";
// A–Z first, then Greek, Cyrillic and other characters, as on the A–Z bar
const LETTER_ORDER = new Map(LETTERS.map((l, i) => [l.key, i]));

/** Newest year first, unknown years last. */
function byYearDesc(a: PublisherTitleRow, b: PublisherTitleRow) {
  return (a.year === null ? 1 : 0) - (b.year === null ? 1 : 0) || (b.year ?? 0) - (a.year ?? 0);
}

/**
 * Rows with their heading, in list order.
 * - year: newest year first (oldest with "asc"), unknown years last; A–Z within a year;
 * - title: by first letter A–Z, then the sort title, then newest year;
 * - author: per author A–Z ("No author" last), then newest year, then A–Z.
 */
export function groupRows(rows: PublisherTitleRow[], group: GroupBy = "year", dir: "asc" | "desc" = "desc"): GroupedRow[] {
  const byTitle = (a: PublisherTitleRow, b: PublisherTitleRow) => collator.compare(a.sortTitle, b.sortTitle) || a.workId - b.workId;

  if (group === "title") {
    return rows
      .map((r) => {
        const key = firstLetter(r.sortTitle);
        return { ...r, group: `l-${key}`, groupLabel: LETTERS.find((l) => l.key === key)?.label ?? "#", rowKey: r.key };
      })
      .sort(
        (a, b) =>
          (LETTER_ORDER.get(a.group.slice(2)) ?? 99) - (LETTER_ORDER.get(b.group.slice(2)) ?? 99) ||
          collator.compare(a.sortTitle, b.sortTitle) ||
          byYearDesc(a, b) ||
          a.workId - b.workId
      );
  }

  if (group === "author") {
    return rows
      .flatMap((r) =>
        (r.authors.length > 0 ? r.authors : [null]).map((a) => ({
          ...r,
          group: a ? `a-${a.id}` : "a-none",
          groupLabel: a ? a.name : NO_AUTHOR,
          rowKey: `${r.key}-${a ? a.id : "none"}`,
        }))
      )
      .sort(
        (a, b) =>
          (a.group === "a-none" ? 1 : 0) - (b.group === "a-none" ? 1 : 0) ||
          collator.compare(a.groupLabel, b.groupLabel) ||
          a.group.localeCompare(b.group) ||
          byYearDesc(a, b) ||
          byTitle(a, b)
      );
  }

  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((r) => ({ ...r, group: `y-${r.year ?? "unknown"}`, groupLabel: r.year === null ? "Unknown year" : String(r.year), rowKey: r.key }))
    .sort(
      (a, b) =>
        (a.year === null ? 1 : 0) - (b.year === null ? 1 : 0) ||
        (a.year !== null && b.year !== null ? sign * (a.year - b.year) : 0) ||
        byTitle(a, b)
    );
}

/** Titles per known year, oldest first, for the year bar. */
export function yearCounts(rows: PublisherTitleRow[]) {
  const counts = new Map<number, number>();
  for (const r of rows) if (r.year !== null) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
  return [...counts].map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
}

/** The page (1-based) on which a group starts; 1 when it is not in the list. */
export function pageOfGroup(sorted: GroupedRow[], group: string, size: number) {
  const i = sorted.findIndex((r) => r.group === group);
  return i < 0 ? 1 : Math.floor(i / size) + 1;
}

export type ListItem =
  | { kind: "group"; id: string; label: string; year: number | null; count: number; continued: boolean }
  | { kind: "row"; row: GroupedRow };

/**
 * One page of rows with a heading before each group. A group that started on an earlier page gets its
 * heading again, marked "continued". `start` is the index of the page's first row in `sorted`.
 */
export function groupPage(sorted: GroupedRow[], start: number, size: number): ListItem[] {
  const counts = new Map<string, number>();
  for (const r of sorted) counts.set(r.group, (counts.get(r.group) ?? 0) + 1);
  const items: ListItem[] = [];
  let previous: string | null = null;
  sorted.slice(start, start + size).forEach((row, i) => {
    if (row.group !== previous) {
      const continued = i === 0 && start > 0 && sorted[start - 1].group === row.group;
      const year = row.group.startsWith("y-") ? row.year : null;
      items.push({ kind: "group", id: row.group, label: row.groupLabel, year, count: counts.get(row.group) ?? 0, continued });
    }
    items.push({ kind: "row", row });
    previous = row.group;
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
