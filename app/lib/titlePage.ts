// Pure helpers for the title page (/titles/[id]). No Supabase import, so they can be unit tested.
import { getMainPhoto, getPhotoUrl } from "./editionUtils";

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
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  publisher: { id: number; name: string } | null;
  photos: TitlePhotoRow[] | null;
  sub_editions: TitleSubEditionRow[] | null;
  edition_contributors: { role: string | null; contributor: { id: number; name: string } | null }[] | null;
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
  illustrators: string[];
  printings: number;
  variants: string[];
  mainPhoto: { src: string; alt: string; credit: string | null } | null;
};

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

/** One edition as shown in the table and on the cards. */
export function toEditionRow(edition: TitleEditionRow): EditionRow {
  const subs = edition.sub_editions || [];
  const limitedSubs = subs
    .filter((s) => s.is_limited_edition)
    .sort((a, b) => (a.limited_state?.sort_order ?? 999) - (b.limited_state?.sort_order ?? 999) || a.id - b.id);
  const variants = [
    // An edition that is itself limited has no kind of its own (limited_states is on sub_editions)
    ...(edition.is_limited_edition ? [limitedLabel(null, edition.limited_edition_count)] : []),
    ...limitedSubs.map((s) => limitedLabel(s.limited_state?.name, s.limited_edition_count)),
  ];
  const main = getMainPhoto(
    (edition.photos || []).map((p) => ({ ...p, is_main: p.is_main ?? undefined }))
  );

  return {
    id: edition.id,
    title: edition.title,
    publisher: edition.publisher,
    year: edition.publication_year,
    binding: edition.binding_type || null,
    illustrators: unique(
      (edition.edition_contributors || [])
        .filter((c) => c.role === "Illustrator" && c.contributor)
        .map((c) => c.contributor!.name)
    ),
    printings: subs.length - limitedSubs.length,
    variants: unique(variants),
    mainPhoto: main
      ? { src: getPhotoUrl(main.storage_path), alt: photoAlt(main as TitlePhotoRow, edition), credit: main.copyright_statement ?? null }
      : null,
  };
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
