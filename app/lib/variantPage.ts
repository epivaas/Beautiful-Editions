// Pure helpers for the variant page (/sub-editions/[id]): a limited sub-edition compared with its edition.
// No Supabase import, so they can be unit tested.
import { limitedEditionName, type EditionPageRow, type EditionSubRow } from "./editionPage";

export const SAME_AS_EDITION = "Same as edition";

function clean(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

/**
 * A field the variant may have of its own (board Variantpagina): a different value shows with the edition's
 * value muted under it; the same value, or none of its own, shows the edition's value as "Same as edition".
 * Null when neither has a value.
 */
export function compareField(own: string | null | undefined, edition: string | null | undefined) {
  const mine = clean(own);
  const theirs = clean(edition);
  if (mine && theirs && mine.toLowerCase() !== theirs.toLowerCase()) return { value: mine, note: `Edition: ${theirs}` };
  if (theirs) return { value: theirs, note: SAME_AS_EDITION };
  if (mine) return { value: mine, note: null };
  return null;
}

export type VariantFact = { label: string; value: string; note: string | null; mono?: boolean; href?: string };

type EditionFields = Pick<
  EditionPageRow,
  "binding_type" | "size_dimensions" | "typeface" | "pages_description" | "printer" | "binder" | "publisher_url"
>;

/**
 * "What sets this variant apart": copies and kind, the fields a variant can differ in (compared with the
 * edition), the fields only an edition has (Same as edition) and the variant's own numbers. Empty fields drop out.
 */
export function variantFacts(sub: EditionSubRow, edition: EditionFields): VariantFact[] {
  const own = (label: string, value: string | null | undefined, mono = false): VariantFact | null => {
    const v = clean(value);
    return v ? { label, value: v, note: null, mono } : null;
  };
  const compared = (label: string, mine: string | null | undefined, theirs: string | null | undefined, mono = false) => {
    const c = compareField(mine, theirs);
    return c ? { label, ...c, mono } : null;
  };
  const url = clean(sub.publisher_url) ?? clean(edition.publisher_url);

  return [
    own("Copies", sub.limited_edition_count ? `Edition of ${sub.limited_edition_count.toLocaleString("en-US")}` : null),
    own("Kind", sub.limited_state?.name),
    compared("Binding", sub.binding_type, edition.binding_type),
    compared("Format", sub.size_dimensions, edition.size_dimensions),
    compared("Typeface", sub.typeface, edition.typeface),
    compared("Pages", null, edition.pages_description, true),
    compared("Printer", null, edition.printer),
    compared("Binder", null, edition.binder),
    // Catalogue number and ISBN belong to the variant itself: never taken over from the edition
    own("Catalogue no.", sub.catalogue_number, true),
    own("ISBN", sub.isbn, true),
    url
      ? { label: "Publisher's page", value: "Visit ↗", href: url, note: clean(sub.publisher_url) ? null : SAME_AS_EDITION }
      : null,
  ].filter((f): f is VariantFact => f !== null);
}

/** Limited sub-editions in the order of the edition page: by kind, then as recorded. */
export function limitedSubs(subs: EditionSubRow[]) {
  return subs
    .filter((s) => s.is_limited_edition)
    .sort((a, b) => (a.limited_state?.sort_order ?? 999) - (b.limited_state?.sort_order ?? 999) || a.id - b.id);
}

/** Short name for a chip: "Lettered", "Hyde", "Limited". */
export function variantChipName(sub: Pick<EditionSubRow, "limited_state" | "impression_label">) {
  return limitedEditionName(sub.limited_state?.name, sub.impression_label).replace(/\s+edition$/i, "");
}

/** The variants of one edition as chips, the current one selected; none when there is only one. */
export function variantChips(subs: EditionSubRow[], currentId: number) {
  const limited = limitedSubs(subs);
  if (limited.length < 2) return [];
  return limited.map((s) => ({
    id: s.id,
    name: variantChipName(s),
    count: s.limited_edition_count ?? undefined,
    href: `/sub-editions/${s.id}`,
    selected: s.id === currentId,
  }));
}
