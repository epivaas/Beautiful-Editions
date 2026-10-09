// Pure helpers for search: the live results in the header and the detailed search. No Supabase import.
import { fold, matchesFilter } from "./overview";

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/**
 * How well texts match: 0 when one starts with the query, 1 when a word in it does, 2 when the query
 * is only somewhere inside a word ("hom" in "Thomas"), 3 without a match.
 */
function matchTier(texts: (string | null | undefined)[], q: string) {
  const query = fold(q.trim());
  let best = 3;
  for (const text of texts) {
    if (!text) continue;
    const t = fold(text);
    if (t.startsWith(query)) return 0;
    if (t.split(/[\s,.'’:;()\-–]+/).some((word) => word.startsWith(query))) best = Math.min(best, 1);
    else if (t.includes(query)) best = Math.min(best, 2);
  }
  return best;
}

/**
 * Best matches first: on the name itself (starts with, then a word starts with), then on secondary texts
 * such as the author of a title, then matches inside a word. Alphabetical within each tier.
 */
function rank<T>(
  items: T[],
  q: string,
  nameOf: (item: T) => string,
  primary: (item: T) => (string | null)[] = (item) => [nameOf(item)],
  secondary: (item: T) => (string | null)[] = () => []
) {
  const score = (item: T) => {
    const p = matchTier(primary(item), q);
    if (p < 2) return p;
    const s = matchTier(secondary(item), q);
    if (s < 2) return 2 + s; // 2 or 3: the author starts with the query
    return 4 + Math.min(p, s); // only inside a word
  };
  const scored = items.map((item) => ({ item, score: score(item) }));
  scored.sort((a, b) => a.score - b.score || collator.compare(nameOf(a.item), nameOf(b.item)));
  return scored.map((s) => s.item);
}

export type QuickTitle = { id: number; title: string; englishTitle: string | null; authors: string[]; editions: number };
export type QuickAuthor = { id: number; name: string; titles: number };
export type QuickPublisher = { id: number; name: string; editions: number };

type Group<T> = { items: T[]; total: number };

export type QuickResults = {
  titles: Group<QuickTitle>;
  authors: Group<QuickAuthor>;
  publishers: Group<QuickPublisher>;
  total: number;
};

type QuickLists = {
  titles: { id: number; title: string; englishTitle: string | null; authors: { name: string }[]; editions: number }[];
  authors: { id: number; name: string; titles: number }[];
  publishers: { id: number; name: string; editions: number }[];
};

export const QUICK_MIN_LENGTH = 2;

/** Live results for the header search, grouped by kind; empty below two characters. */
export function quickSearch(lists: QuickLists, q: string, perGroup = 5): QuickResults {
  const empty = { items: [], total: 0 };
  if (q.trim().length < QUICK_MIN_LENGTH) return { titles: empty, authors: empty, publishers: empty, total: 0 };

  const titles = rank(
    lists.titles.filter((t) => matchesFilter([t.title, t.englishTitle, ...t.authors.map((a) => a.name)], q)),
    q,
    (t) => t.title,
    (t) => [t.title, t.englishTitle],
    (t) => t.authors.map((a) => a.name)
  );
  const authors = rank(lists.authors.filter((a) => matchesFilter([a.name], q)), q, (a) => a.name);
  const publishers = rank(lists.publishers.filter((p) => matchesFilter([p.name], q)), q, (p) => p.name);

  return {
    titles: {
      items: titles.slice(0, perGroup).map((t) => ({
        id: t.id,
        title: t.title,
        englishTitle: t.englishTitle,
        authors: t.authors.map((a) => a.name),
        editions: t.editions,
      })),
      total: titles.length,
    },
    authors: { items: authors.slice(0, perGroup), total: authors.length },
    publishers: { items: publishers.slice(0, perGroup), total: publishers.length },
    total: titles.length + authors.length + publishers.length,
  };
}

/** One edition as the detailed search sees it. */
export type EditionSearchRow = {
  id: number;
  title: string;
  publisher: { id: number; name: string } | null;
  seriesId: number | null;
  year: number | null;
  language: string | null;
  binding: string | null;
  illustrators: string[];
  authors: string[];
  workTitles: string[];
  /** The edition itself or one of its sub-editions is limited. */
  limited: boolean;
  slipcase: boolean;
  /** The edition or one of its sub-editions has a photo. */
  hasPhotos: boolean;
};

export type SearchCriteria = {
  title: string | null;
  author: string | null;
  publisher: number | null;
  series: number | null;
  illustrator: string | null;
  binding: string | null;
  from: number | null;
  to: number | null;
  language: string | null;
  limited: boolean;
  slipcase: boolean;
  photos: boolean;
};

const TEXT_KEYS = ["title", "author", "illustrator", "binding", "language"] as const;
const NUMBER_KEYS = ["publisher", "series", "from", "to"] as const;
const FLAG_KEYS = ["limited", "slipcase", "photos"] as const;

/** Criteria from the URL; anything unknown or empty is ignored. */
export function parseCriteria(params: Record<string, string | undefined>): SearchCriteria {
  const text = (key: string) => params[key]?.trim() || null;
  const number = (key: string) => {
    const n = Number(params[key]);
    return params[key] && Number.isInteger(n) ? n : null;
  };
  const flag = (key: string) => params[key] === "1";
  return {
    title: text("title"),
    author: text("author"),
    publisher: number("publisher"),
    series: number("series"),
    illustrator: text("illustrator"),
    binding: text("binding"),
    from: number("from"),
    to: number("to"),
    language: text("language"),
    limited: flag("limited"),
    slipcase: flag("slipcase"),
    photos: flag("photos"),
  };
}

export function hasCriteria(c: SearchCriteria) {
  return (
    TEXT_KEYS.some((k) => c[k] !== null) || NUMBER_KEYS.some((k) => c[k] !== null) || FLAG_KEYS.some((k) => c[k])
  );
}

/** URL parameters for criteria; empty values are left out. */
export function criteriaParams(c: SearchCriteria): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of TEXT_KEYS) if (c[k]) out[k] = c[k] as string;
  for (const k of NUMBER_KEYS) if (c[k] !== null) out[k] = String(c[k]);
  for (const k of FLAG_KEYS) if (c[k]) out[k] = "1";
  return out;
}

/**
 * Every word of the query starts a word in the texts, ignoring case and accents: "dore" finds
 * "Doré, Gustave" and "King, Stephen" does not find "Hawking, Stephen".
 */
export function matchesWordStart(texts: (string | null | undefined)[], q: string) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  const haystack = fold(texts.filter(Boolean).join(" "));
  return words.every((w) => {
    for (let i = haystack.indexOf(w); i !== -1; i = haystack.indexOf(w, i + 1)) {
      if (i === 0 || !/[\p{L}\p{N}]/u.test(haystack[i - 1])) return true;
    }
    return false;
  });
}

/** Editions that meet every criterion. Text fields match at the start of a word (matchesWordStart). */
export function filterEditions(rows: EditionSearchRow[], c: SearchCriteria) {
  const contains = (values: (string | null)[], q: string | null) => q === null || matchesWordStart(values, q);
  return rows.filter(
    (e) =>
      contains([e.title, ...e.workTitles], c.title) &&
      contains(e.authors, c.author) &&
      contains(e.illustrators, c.illustrator) &&
      contains([e.binding], c.binding) &&
      (c.publisher === null || e.publisher?.id === c.publisher) &&
      (c.series === null || e.seriesId === c.series) &&
      (c.language === null || e.language === c.language) &&
      (c.from === null || (e.year !== null && e.year >= c.from)) &&
      (c.to === null || (e.year !== null && e.year <= c.to)) &&
      (!c.limited || e.limited) &&
      (!c.slipcase || e.slipcase) &&
      (!c.photos || e.hasPhotos)
  );
}

export type FacetOption = { value: string; label: string; count: number };
export type FacetField = "publisher" | "series" | "language";

/**
 * The choices for one list of the detailed search: values found among the editions that meet every
 * other criterion, with their counts, so a choice never leads to an empty page. The chosen value
 * always stays, even at 0, so it can be seen and cleared. `names` gives the label for publisher and series ids.
 */
export function facetCounts(
  rows: EditionSearchRow[],
  c: SearchCriteria,
  field: FacetField,
  names: Map<string, string> = new Map()
): FacetOption[] {
  const valueOf = (e: EditionSearchRow) =>
    field === "publisher" ? (e.publisher ? String(e.publisher.id) : null) : field === "series" ? (e.seriesId !== null ? String(e.seriesId) : null) : e.language;
  const counts = new Map<string, number>();
  for (const e of filterEditions(rows, { ...c, [field]: null })) {
    const v = valueOf(e);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const chosen = c[field] === null ? null : String(c[field]);
  if (chosen !== null && !counts.has(chosen)) counts.set(chosen, 0);
  return [...counts]
    .map(([value, count]) => ({ value, label: field === "language" ? value : (names.get(value) ?? value), count }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

export type SuggestField = "author" | "illustrator" | "binding";

/**
 * Suggestions for a text field of the detailed search, taken from the editions that meet every other
 * criterion, with the number of editions per value. Values that start with the query come first.
 */
export function suggestFor(rows: EditionSearchRow[], c: SearchCriteria, field: SuggestField, q: string, limit = 8) {
  if (q.trim().length < 1) return [];
  const valuesOf = (e: EditionSearchRow) =>
    field === "author" ? e.authors : field === "illustrator" ? e.illustrators : e.binding ? [e.binding.trim()] : [];
  const counts = new Map<string, number>();
  for (const e of filterEditions(rows, { ...c, [field]: null })) {
    for (const v of new Set(valuesOf(e))) if (v && matchesWordStart([v], q)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return rank([...counts.keys()], q, (v) => v)
    .slice(0, limit)
    .map((value) => ({ value, count: counts.get(value) ?? 0 }));
}

/** The set criteria as short chip labels for an empty result: "2008", "Full leather", "With slipcase". */
export function criteriaLabels(
  c: SearchCriteria,
  names: { publishers: { id: number; name: string }[]; series: { id: number; name: string }[] }
) {
  const years =
    c.from !== null && c.to !== null
      ? c.from === c.to
        ? String(c.from)
        : `${c.from} to ${c.to}`
      : c.from !== null
        ? `From ${c.from}`
        : c.to !== null
          ? `Until ${c.to}`
          : null;
  return [
    c.title,
    c.author,
    c.publisher !== null ? names.publishers.find((p) => p.id === c.publisher)?.name ?? null : null,
    c.series !== null ? names.series.find((s) => s.id === c.series)?.name ?? null : null,
    c.illustrator,
    c.binding,
    years,
    c.language,
    c.limited ? "Limited editions" : null,
    c.slipcase ? "With slipcase" : null,
    c.photos ? "With photos" : null,
  ].filter((label): label is string => !!label);
}
