// Pure helpers for the title page (/titles/[id]). No Supabase import, so they can be unit tested.
import { getPhotoUrl } from "./editionUtils";

export type TitlePhotoRow = {
  id: number;
  storage_path: string;
  caption: string | null;
  copyright_statement: string | null;
  is_main: boolean | null;
  sort_order: number;
};

export type TitleSubEditionRow = {
  id: number;
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  /** Kind of limited sub-edition (Lettered, Numbered, Named Edition...), from the limited_states list. */
  limited_state?: { name: string; sort_order: number } | null;
  photos: TitlePhotoRow[] | null;
};

export type TitleEditionRow = {
  id: number;
  title: string;
  publication_year: number | null;
  language: string | null;
  binding_type: string | null;
  pages_description?: string | null;
  notes?: string | null;
  slipcase?: boolean | null;
  dustjacket?: boolean | null;
  clamshell?: boolean | null;
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  publisher: { id: number; name: string } | null;
  photos: TitlePhotoRow[] | null;
  sub_editions: TitleSubEditionRow[] | null;
  edition_contributors: { role: string | null; contributor: { id: number; name: string } | null }[] | null;
  /** All titles this edition contains (most editions have one). */
  work_editions?: { id: number; work: { id: number; original_title: string } | null }[] | null;
};

export type TitleWorkRow = {
  id: number;
  original_title: string;
  english_title: string | null;
  original_publication_year: string | null;
  original_language: string | null;
  wiki_link: string | null;
  work_authors: { author: { id: number; name: string } | null }[] | null;
  work_editions: { edition: TitleEditionRow | null }[] | null;
};

export type TitlePhoto = { id: number; src: string; alt: string; credit: string | null };

export type EditionRow = {
  id: number;
  title: string;
  publisher: { id: number; name: string } | null;
  year: number | null;
  binding: string | null;
  pages: string | null;
  illustrators: string[];
  /** What comes with the book, all equal: Slipcase, Clamshell box, Dust jacket. */
  includes: string[];
  /** Editorial note, whitespace collapsed; the cards clamp it to three lines. */
  note: string | null;
  printings: number;
  variantCount: number;
  variants: string[];
  /** Photos of the edition and its sub-editions, main photo first. */
  photos: TitlePhoto[];
  photoCount: number;
  /** Other titles in the same edition, for "Also contains". */
  otherTitles: { id: number; title: string }[];
};

export type SortKey = "year" | "publisher" | "name";
export type SortDir = "asc" | "desc";

/** Editions of a work, oldest first (as on the board), id as tiebreaker. */
export function sortEditions(work: TitleWorkRow): TitleEditionRow[] {
  return (work.work_editions || [])
    .map((link) => link.edition)
    .filter((e): e is TitleEditionRow => e !== null)
    .sort((a, b) => (a.publication_year ?? 9999) - (b.publication_year ?? 9999) || a.id - b.id);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

/** Facts for the Gloed block: number of editions, publishers, year span and languages. */
export function summarize(editions: TitleEditionRow[]) {
  const years = editions.map((e) => e.publication_year).filter((y): y is number => y !== null);
  const min = years.length ? Math.min(...years) : null;
  const max = years.length ? Math.max(...years) : null;

  return {
    editions: editions.length,
    publishers: unique(editions.map((e) => e.publisher?.id).filter((id) => id !== undefined)).length,
    years: min === null ? null : min === max ? String(min) : `${min} to ${max}`,
    languages: unique(editions.map((e) => e.language).filter((l): l is string => !!l)),
  };
}

function photoAlt(photo: TitlePhotoRow, edition: TitleEditionRow) {
  return photo.caption || [edition.title, edition.publisher?.name].filter(Boolean).join(", ");
}

/** All photos of the editions and their sub-editions: main photos first, then newest edition, then sort order. */
/** Photos of one (sub-)edition: main photo first, then sort order. Alt text is the caption or `fallbackAlt`. */
export function toPhotos(rows: TitlePhotoRow[] | null, fallbackAlt: string): TitlePhoto[] {
  return [...(rows ?? [])]
    .sort(
      (a, b) =>
        Number(Boolean(b.is_main)) - Number(Boolean(a.is_main)) || a.sort_order - b.sort_order || a.id - b.id
    )
    .map((photo) => ({
      id: photo.id,
      src: getPhotoUrl(photo.storage_path),
      alt: photo.caption || fallbackAlt,
      credit: photo.copyright_statement,
    }));
}

export function collectPhotos(editions: TitleEditionRow[]): TitlePhoto[] {
  const rows = editions.flatMap((edition) =>
    [...(edition.photos || []), ...(edition.sub_editions || []).flatMap((s) => s.photos || [])].map((photo) => ({
      photo,
      edition,
    }))
  );

  return rows
    .sort(
      (a, b) =>
        Number(Boolean(b.photo.is_main)) - Number(Boolean(a.photo.is_main)) ||
        (b.edition.publication_year ?? 0) - (a.edition.publication_year ?? 0) ||
        a.photo.sort_order - b.photo.sort_order ||
        a.photo.id - b.photo.id
    )
    .map(({ photo, edition }) => ({
      id: photo.id,
      src: getPhotoUrl(photo.storage_path),
      alt: photoAlt(photo, edition),
      credit: photo.copyright_statement,
    }));
}

/**
 * Label of a limited (sub-)edition: "Lettered · 26", or just "Lettered" without a count.
 * Without a known kind it falls back to "Edition of 26" / "Limited edition".
 */
export function limitedLabel(kind: string | null | undefined, count: number | null) {
  const n = count ? count.toLocaleString("en-US") : null;
  if (kind) return n ? `${kind} · ${n}` : kind;
  return n ? `Edition of ${n}` : "Limited edition";
}

export type IncludesFlags = {
  slipcase?: boolean | null;
  dustjacket?: boolean | null;
  clamshell?: boolean | null;
};

/** What comes with an edition or sub-edition, in a fixed order: Slipcase, Clamshell box, Dust jacket. */
export function includesOf(flags: IncludesFlags) {
  return INCLUDES.filter(([field]) => flags[field] === true).map(([, label]) => label);
}

const INCLUDES: [keyof IncludesFlags, string][] = [
  ["slipcase", "Slipcase"],
  ["clamshell", "Clamshell box"],
  ["dustjacket", "Dust jacket"],
];

/** One edition as shown on the Cards and Grid views. */
export function toEditionRow(edition: TitleEditionRow, currentWorkId?: number): EditionRow {
  const subs = edition.sub_editions || [];
  const limitedSubs = subs
    .filter((s) => s.is_limited_edition)
    .sort((a, b) => (a.limited_state?.sort_order ?? 999) - (b.limited_state?.sort_order ?? 999) || a.id - b.id);
  const variants = [
    // An edition that is itself limited has no kind of its own (limited_states is on sub_editions)
    ...(edition.is_limited_edition ? [limitedLabel(null, edition.limited_edition_count)] : []),
    ...limitedSubs.map((s) => limitedLabel(s.limited_state?.name, s.limited_edition_count)),
  ];
  const photos = collectPhotos([edition]);
  const uniqueVariants = unique(variants);
  const note = edition.notes?.replace(/\s+/g, " ").trim() || null;

  return {
    id: edition.id,
    title: edition.title,
    publisher: edition.publisher,
    year: edition.publication_year,
    binding: edition.binding_type || null,
    pages: edition.pages_description || null,
    illustrators: unique(
      (edition.edition_contributors || [])
        .filter((c) => c.role === "Illustrator" && c.contributor)
        .map((c) => c.contributor!.name)
    ),
    includes: includesOf(edition),
    note,
    printings: subs.length - limitedSubs.length,
    variantCount: uniqueVariants.length,
    variants: uniqueVariants,
    photos,
    photoCount: photos.length,
    otherTitles: [...(edition.work_editions ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((link) => link.work)
      .filter((w): w is { id: number; original_title: string } => w !== null && w.id !== currentWorkId)
      .map((w) => ({ id: w.id, title: w.original_title })),
  };
}

const collator = new Intl.Collator("en", { sensitivity: "base" });

/**
 * Sort editions for the Sort by control. Year: unknown years last (in both directions);
 * publisher and name fall back to year, and id keeps equal rows in a stable order.
 */
export function sortRows(rows: EditionRow[], key: SortKey, dir: SortDir): EditionRow[] {
  const sign = dir === "desc" ? -1 : 1;
  const byYear = (a: EditionRow, b: EditionRow) => {
    if (a.year === null || b.year === null) return a.year === b.year ? 0 : a.year === null ? 1 : -1;
    return sign * (a.year - b.year);
  };

  return [...rows].sort((a, b) => {
    let primary = 0;
    if (key === "publisher") primary = sign * collator.compare(a.publisher?.name ?? "", b.publisher?.name ?? "");
    if (key === "name") primary = sign * collator.compare(a.title, b.title);
    return primary || byYear(a, b) || a.id - b.id;
  });
}

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/** "2 variants · 3 printings · 18 photos"; parts that are zero are left out. */
export function countLine(row: EditionRow) {
  return [
    row.variantCount > 0 && plural(row.variantCount, "variant"),
    row.printings > 0 && plural(row.printings, "printing"),
    row.photoCount > 0 && plural(row.photoCount, "photo"),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Publishers with their number of editions, in order of first appearance. */
export function publisherCounts(editions: TitleEditionRow[]) {
  const counts = new Map<number, { id: number; name: string; count: number }>();
  for (const e of editions) {
    if (!e.publisher) continue;
    const entry = counts.get(e.publisher.id) ?? { ...e.publisher, count: 0 };
    entry.count++;
    counts.set(e.publisher.id, entry);
  }
  return [...counts.values()];
}

export function filterByPublisher(editions: TitleEditionRow[], publisherId: number | null) {
  return publisherId === null ? editions : editions.filter((e) => e.publisher?.id === publisherId);
}
