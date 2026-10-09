// Pure helpers for the series page (/series/[id]). No Supabase import, so they can be unit tested.

export type SeriesEditionRow = {
  id: number;
  title: string;
  publication_year: number | null;
  sequence_number: number | null;
  work_editions: { work: { work_authors: { author: { name: string } | null }[] | null } | null }[] | null;
};

export type SeriesRow = {
  id: number;
  title: string;
  authors: string[];
  year: number | null;
  /** Published after this year: shown at the bottom with the label "Announced" (DESIGN.md §7). */
  announced: boolean;
};

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "The Letterpress Shakespeare: The Tempest" in that series is "The Tempest". */
export function withoutSeriesName(title: string, seriesName: string) {
  const name = seriesName.trim();
  if (!name) return title.trim();
  const rest = title.trim().replace(new RegExp(`^${escapeRegExp(name)}\\s*[:,.–—-]\\s*`, "i"), "");
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : title.trim();
}

/**
 * The volumes of a series in order of publication (then their sequence number); announced volumes at
 * the bottom. `now` is the current year.
 */
export function seriesRows(editions: SeriesEditionRow[], now: number, seriesName = ""): SeriesRow[] {
  return editions
    .map((e) => ({
      id: e.id,
      sequence: e.sequence_number,
      title: withoutSeriesName(e.title, seriesName),
      authors: [
        ...new Set(
          (e.work_editions ?? []).flatMap((we) =>
            (we.work?.work_authors ?? []).map((wa) => wa.author?.name.trim()).filter((n): n is string => !!n)
          )
        ),
      ],
      year: e.publication_year,
      announced: e.publication_year !== null && e.publication_year > now,
    }))
    .sort(
      (a, b) =>
        Number(a.announced) - Number(b.announced) ||
        (a.year ?? 9999) - (b.year ?? 9999) ||
        (a.sequence ?? 9999) - (b.sequence ?? 9999) ||
        a.id - b.id
    )
    .map((row) => ({ id: row.id, title: row.title, authors: row.authors, year: row.year, announced: row.announced }));
}
