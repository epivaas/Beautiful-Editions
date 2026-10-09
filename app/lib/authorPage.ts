// Pure helpers for the author page (/author/[id]). No Supabase import, so they can be unit tested.
import { sortableYear } from "./overview";

export type AuthorWork = {
  id: number;
  original_title: string;
  english_title: string | null;
  original_publication_year: string | null;
  sort_title: string | null;
};

/** One edition of one of the author's works, with its publisher. */
export type AuthorEditionLink = { workId: number; editionId: number; publisher: { id: number; name: string } | null };

export type AuthorTitleRow = {
  id: number;
  title: string;
  /** Only when it differs from the original title. */
  englishTitle: string | null;
  firstPublished: string | null;
  /** For sorting on First published: "c. 700 BC" is -700. */
  firstYear: number | null;
  sortTitle: string;
  editions: number;
  publishers: { id: number; name: string }[];
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/** The author's titles, A–Z on the sort title, each with its number of editions and its publishers. */
export function authorTitleRows(works: AuthorWork[], links: AuthorEditionLink[]): AuthorTitleRow[] {
  return works
    .map((w) => {
      const own = links.filter((l) => l.workId === w.id);
      const publishers = new Map<number, { id: number; name: string }>();
      for (const l of own) if (l.publisher) publishers.set(l.publisher.id, { id: l.publisher.id, name: l.publisher.name.trim() });
      const english = w.english_title?.trim() || null;
      return {
        id: w.id,
        title: w.original_title,
        englishTitle: english && english.toLowerCase() !== w.original_title.trim().toLowerCase() ? english : null,
        firstPublished: w.original_publication_year?.trim() || null,
        firstYear: sortableYear(w.original_publication_year),
        sortTitle: w.sort_title || w.original_title,
        editions: new Set(own.map((l) => l.editionId)).size,
        publishers: [...publishers.values()].sort((a, b) => collator.compare(a.name, b.name)),
      };
    })
    .sort((a, b) => collator.compare(a.sortTitle, b.sortTitle) || a.id - b.id);
}

/** Titles (not editions) per publisher, most first (board Auteur en reeks). */
export function titlesPerPublisher(rows: AuthorTitleRow[]) {
  const counts = new Map<number, { id: number; name: string; titles: number }>();
  for (const row of rows) {
    for (const p of row.publishers) {
      const entry = counts.get(p.id) ?? { ...p, titles: 0 };
      entry.titles += 1;
      counts.set(p.id, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.titles - a.titles || collator.compare(a.name, b.name));
}

/** For the Gloed block: titles, and under it the publishers and editions. */
export function authorCounts(rows: AuthorTitleRow[], links: AuthorEditionLink[]) {
  return {
    titles: rows.length,
    publishers: new Set(rows.flatMap((r) => r.publishers.map((p) => p.id))).size,
    editions: new Set(links.map((l) => l.editionId)).size,
  };
}
