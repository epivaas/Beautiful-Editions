// Pure helpers for the edition page (/edition/[id]). No Supabase import, so they can be unit tested.
import { includesOf, toPhotos, type TitlePhoto, type TitlePhotoRow } from "./titlePage";

export type EditionSubRow = {
  id: number;
  impression_label: string | null;
  sequence_number: number | null;
  catalogue_number: string | null;
  isbn: string | null;
  binding_type: string | null;
  size_dimensions: string | null;
  typeface: string | null;
  slipcase: boolean | null;
  dustjacket: boolean | null;
  clamshell: boolean | null;
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  limited_state: { name: string; sort_order: number } | null;
  photos: TitlePhotoRow[] | null;
};

export type EditionWorkRow = {
  id: number;
  original_title: string;
  english_title: string | null;
  work_authors: { author: { id: number; name: string } | null }[] | null;
};

export type EditionPageRow = {
  id: number;
  title: string;
  publication_year: number | null;
  language: string | null;
  isbn: string | null;
  catalogue_number: string | null;
  publisher_url: string | null;
  binding_type: string | null;
  pages_description: string | null;
  size_dimensions: string | null;
  typeface: string | null;
  printer: string | null;
  binder: string | null;
  notes: string | null;
  details: string | null;
  slipcase: boolean | null;
  dustjacket: boolean | null;
  clamshell: boolean | null;
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  publisher: { id: number; name: string } | null;
  series: { id: number; name: string } | null;
  photos: TitlePhotoRow[] | null;
  sub_editions: EditionSubRow[] | null;
  edition_contributors: { role: string | null; contributor: { id: number; name: string } | null }[] | null;
  work_editions: { id: number; work: EditionWorkRow | null }[] | null;
};

export type Fact = { label: string; value: string | null };

/** Card name of a limited sub-edition (DESIGN.md §6): kind + "edition"; a Named Edition uses its own name. */
export function limitedEditionName(stateName: string | null | undefined, label: string | null) {
  if (!stateName) return "Limited edition";
  if (stateName === "Named Edition") {
    const own = label?.split(":")[0]?.trim();
    return label?.includes(":") && own ? own : "Named edition";
  }
  return /\b(edition|state)$/i.test(stateName) ? stateName : `${stateName} edition`;
}

const ORDINAL =
  "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|\\d+(?:st|nd|rd|th)";
const PRINTING_RE = new RegExp(`^\\[?\\s*((?:${ORDINAL})\\s+(?:printing|impression|reprint))\\s*\\]?\\s*:?\\s*(.*)$`, "is");
const YEAR_RE = /\b(1[5-9]\d\d|20\d\d)\b/;

/**
 * Split an impression_label like "Second printing: 2004 (blue cloth)." into name, year and differences.
 * Labels without that pattern keep the whole text as name; the year is still looked up in the text.
 */
export function parsePrinting(label: string | null) {
  const text = (label ?? "").replace(/\s+/g, " ").trim();
  const yearMatch = text.match(YEAR_RE);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const m = text.match(PRINTING_RE);
  if (!m) return { name: text, year, differences: null as string | null };

  const name = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const differences =
    m[2]
      .replace(YEAR_RE, "")
      .replace(/^[\s.,;:()–-]+|[\s.,;:()–-]+$/g, "")
      .trim() || null;
  return { name, year, differences };
}

export type PrintingRow = {
  id: number;
  name: string;
  year: number | null;
  copies: number | null;
  differences: string | null;
  description: string;
  facts: Fact[];
  photos: TitlePhoto[];
  expandable: boolean;
};

// Longer than this, the name is cut off in the row and the full text only shows when opened
const ROW_TEXT = 70;

export function toPrintingRow(sub: EditionSubRow, editionTitle: string): PrintingRow {
  const description = (sub.impression_label ?? "").replace(/\s+/g, " ").trim();
  const { name, year, differences } = parsePrinting(description);
  const includes = includesOf(sub);
  const facts: Fact[] = [
    { label: "Binding", value: sub.binding_type },
    { label: "Includes", value: includes.length ? includes.join(", ") : null },
    { label: "Format", value: sub.size_dimensions },
    { label: "Typeface", value: sub.typeface },
    { label: "Catalogue no.", value: sub.catalogue_number },
    { label: "ISBN", value: sub.isbn },
  ].filter((f) => f.value);
  const photos = toPhotos(sub.photos, `${editionTitle}, ${name}`);

  return {
    id: sub.id,
    name,
    year,
    copies: sub.limited_edition_count,
    differences,
    description,
    facts,
    photos,
    expandable: facts.length > 0 || photos.length > 0 || name.length > ROW_TEXT || (differences?.length ?? 0) > ROW_TEXT,
  };
}

export type LimitedCard = {
  id: number;
  name: string;
  copies: string | null;
  description: string | null;
  photos: TitlePhoto[];
  href: string;
};

export function toLimitedCards(subs: EditionSubRow[], editionTitle: string): LimitedCard[] {
  return subs
    .filter((s) => s.is_limited_edition)
    .sort((a, b) => (a.limited_state?.sort_order ?? 999) - (b.limited_state?.sort_order ?? 999) || a.id - b.id)
    .map((s) => ({
      id: s.id,
      name: limitedEditionName(s.limited_state?.name, s.impression_label),
      copies: s.limited_edition_count ? `Edition of ${s.limited_edition_count.toLocaleString("en-US")}` : null,
      description: s.impression_label?.replace(/\s+/g, " ").trim() || null,
      photos: toPhotos(s.photos, `${editionTitle}, ${limitedEditionName(s.limited_state?.name, s.impression_label)}`),
      href: `/sub-editions/${s.id}`,
    }));
}

/** Non-limited sub-editions in their recorded order. */
export function toPrintingRows(subs: EditionSubRow[], editionTitle: string) {
  return subs
    .filter((s) => !s.is_limited_edition)
    .sort((a, b) => (a.sequence_number ?? 9999) - (b.sequence_number ?? 9999) || a.id - b.id)
    .map((s) => toPrintingRow(s, editionTitle));
}

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Gloed block (DESIGN.md §6 Editiepagina): several titles first, then limited editions, then printings,
 * then photos. Returns null when there is nothing to count; the page then shows an empty Gloed block.
 */
export function bandCounts(c: { titles: number; limited: number; printings: number; photos: number }) {
  const rest = (parts: [number, string][]) => parts.filter(([n]) => n > 0).map(([n, w]) => plural(n, w));
  if (c.titles > 1)
    return { value: c.titles, label: "titles", lines: rest([[c.limited, "limited edition"], [c.printings, "printing"], [c.photos, "photo"]]) };
  if (c.limited > 0)
    return {
      value: c.limited,
      label: c.limited === 1 ? "limited edition" : "limited editions",
      lines: rest([[c.printings, "printing"], [c.photos, "photo"]]),
    };
  if (c.printings > 0)
    return { value: c.printings, label: c.printings === 1 ? "printing" : "printings", lines: rest([[c.photos, "photo"]]) };
  if (c.photos > 0) return { value: c.photos, label: c.photos === 1 ? "photo" : "photos", lines: [] };
  return null;
}

/** Titles of an edition in the order they were linked. */
export function worksOf(edition: Pick<EditionPageRow, "work_editions">): EditionWorkRow[] {
  return [...(edition.work_editions ?? [])]
    .sort((a, b) => a.id - b.id)
    .map((link) => link.work)
    .filter((w): w is EditionWorkRow => w !== null);
}

/** Titles in an edition with the current one marked; `from` only counts if the edition really contains it. */
export function containsTitles(works: EditionWorkRow[], fromId: number | null) {
  const current = works.find((w) => w.id === fromId) ?? works[0] ?? null;
  return {
    current,
    titles: works.map((w) => ({ id: w.id, title: w.original_title, current: w.id === current?.id })),
  };
}

/** Names per contributor role, each name once. */
export function contributorsByRole(rows: EditionPageRow["edition_contributors"]) {
  const byRole = new Map<string, string[]>();
  for (const row of rows ?? []) {
    if (!row.role || !row.contributor) continue;
    const names = byRole.get(row.role) ?? [];
    if (!names.includes(row.contributor.name)) names.push(row.contributor.name);
    byRole.set(row.role, names);
  }
  return (role: string) => byRole.get(role) ?? [];
}
