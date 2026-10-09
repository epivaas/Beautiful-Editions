// Pure helpers for the overview pages (Titles, Authors, Publishers, Series). No Supabase import.

export type SortDir = "asc" | "desc";

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/** Lower case without accents, for filtering: "Odýsseia" becomes "odysseia". */
export function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * A–Z bar key of a name or sort title: "A"–"Z" for Latin script (accents ignored), "greek" and
 * "cyrillic" for those scripts, and "other" for digits and every other script.
 */
export function firstLetter(text: string | null | undefined) {
  const c = fold((text ?? "").trim()).charAt(0);
  const upper = c.toUpperCase();
  if (upper >= "A" && upper <= "Z") return upper;
  // After folding, polytonic Greek (U+1F00–1FFF) is reduced to the basic Greek block
  if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(c)) return "greek";
  if (/[\u0400-\u04FF]/.test(c)) return "cyrillic";
  return "other";
}

/** Buttons of the A–Z bar: the key goes in the URL, the label is what you see. */
export const LETTERS: { key: string; label: string; name: string }[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => ({ key: l, label: l, name: l })),
  { key: "greek", label: "Α–Ω", name: "Greek" },
  { key: "cyrillic", label: "А–Я", name: "Cyrillic" },
  { key: "other", label: "#", name: "Other characters" },
];

export function isLetterKey(value: string | null | undefined): value is string {
  return LETTERS.some((l) => l.key === value);
}

/** How many rows start with each letter (letters without rows are left out). */
export function letterCounts<T>(rows: T[], textOf: (row: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const letter = firstLetter(textOf(row));
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

/** True when every word of the filter occurs in one of the texts (case and accents ignored). */
export function matchesFilter(texts: (string | null | undefined)[], q: string | null | undefined) {
  const words = fold(q ?? "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(texts.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}

type SortValue = string | number | null | undefined;

/**
 * Sort rows on one value. Empty values go last in both directions; `id` keeps equal rows stable.
 * Text is compared with a collator (case and accents ignored, numbers in natural order).
 */
export function sortBy<T extends { id: number }>(rows: T[], valueOf: (row: T) => SortValue, dir: SortDir): T[] {
  const sign = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    const emptyA = va === null || va === undefined || va === "";
    const emptyB = vb === null || vb === undefined || vb === "";
    if (emptyA || emptyB) return emptyA === emptyB ? a.id - b.id : emptyA ? 1 : -1;
    const primary =
      typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb));
    return sign * primary || a.id - b.id;
  });
}

/** One page of rows; a page outside the range is clamped to the nearest page. */
export function paginate<T>(rows: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), totalPages);
  const start = (current - 1) * size;
  return {
    page: current,
    totalPages,
    rows: rows.slice(start, start + size),
    from: rows.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, rows.length),
    total: rows.length,
  };
}

/** "1947 to 2024", "2018", or null without years. */
export function yearSpan(years: (number | null | undefined)[]) {
  const known = years.filter((y): y is number => typeof y === "number");
  if (known.length === 0) return null;
  const min = Math.min(...known);
  const max = Math.max(...known);
  return min === max ? String(min) : `${min} to ${max}`;
}

/**
 * Years a publisher is active: "1947 to now" when the latest year is this year or last year,
 * otherwise "1947 to 2009" (or a single year). Null without years.
 */
export function activeSpan(years: (number | null | undefined)[], now: number) {
  const known = years.filter((y): y is number => typeof y === "number");
  if (known.length === 0) return null;
  const min = Math.min(...known);
  const max = Math.max(...known);
  if (max >= now - 1) return `${min} to now`;
  return min === max ? String(min) : `${min} to ${max}`;
}

/** Leading year of a free-text year such as "1605", "c. 700 BC" (−700) or "1847–48"; null without one. */
export function sortableYear(text: string | null | undefined) {
  if (!text) return null;
  const m = text.match(/(\d{1,4})/);
  if (!m) return null;
  const n = Number(m[1]);
  return /\bBC\b/i.test(text) ? -n : n;
}

export type OverviewState = Record<string, string | null | undefined>;

/**
 * Link for an overview page: the current state plus changes; empty values and defaults stay out of the URL.
 * Any change other than `page` sends you back to page 1.
 */
export function overviewHref(
  base: string,
  state: OverviewState,
  changes: OverviewState,
  defaults: OverviewState = {}
) {
  const next: OverviewState = { ...state, ...changes };
  if (!("page" in changes)) next.page = null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value && value !== defaults[key]) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? word : pluralWord}`;
}

export type HighlightPart = { text: string; match: boolean };

/**
 * Split `text` into parts that match a word of the filter and parts that don't, ignoring case and
 * accents: "odyss" marks "Odýss" in "Odýsseia" in its original spelling. Overlapping matches merge.
 */
export function highlightParts(text: string, q: string | null | undefined): HighlightPart[] {
  const words = fold(q ?? "").split(/\s+/).filter(Boolean);
  if (!text || words.length === 0) return [{ text, match: false }];

  // Fold character by character, remembering where each folded character came from
  const chars = Array.from(text);
  let folded = "";
  const origin: number[] = [];
  chars.forEach((ch, i) => {
    const f = fold(ch);
    folded += f;
    for (let k = 0; k < f.length; k++) origin.push(i);
  });

  const marked = new Array<boolean>(chars.length).fill(false);
  for (const word of words) {
    let from = folded.indexOf(word);
    while (from !== -1) {
      for (let k = from; k < from + word.length; k++) marked[origin[k]] = true;
      from = folded.indexOf(word, from + 1);
    }
  }

  const parts: HighlightPart[] = [];
  chars.forEach((ch, i) => {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += ch;
    else parts.push({ text: ch, match: marked[i] });
  });
  return parts;
}
