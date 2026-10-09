// Pure helpers for photographs: the filter on the Photographs page and the lightbox.
// No Supabase import, so they can be unit tested.
import type { TitlePhoto } from "./titlePage";

export type PhotoFilter = { key: string; label: string; count: number; param: { edition?: number; sub?: number } };

/**
 * Chips for the Photographs page (board Fotos): "All", then one per edition with photos and one per
 * sub-edition with its own photos, in the order the photos come in.
 */
export function photoFilters(photos: TitlePhoto[]): PhotoFilter[] {
  const editions = new Map<number, PhotoFilter>();
  const subs = new Map<number, PhotoFilter>();
  for (const p of photos) {
    const place = p.place;
    if (!place || place.editionId === null) continue;
    const edition = editions.get(place.editionId) ?? {
      key: `e${place.editionId}`,
      label: place.subEditionId === null ? place.label : place.label.split(" · ")[0],
      count: 0,
      param: { edition: place.editionId },
    };
    edition.count += 1;
    editions.set(place.editionId, edition);
    if (place.subEditionId !== null) {
      const sub = subs.get(place.subEditionId) ?? { key: `s${place.subEditionId}`, label: place.label, count: 0, param: { sub: place.subEditionId } };
      sub.count += 1;
      subs.set(place.subEditionId, sub);
    }
  }
  // Each edition followed by its sub-editions
  const out: PhotoFilter[] = [{ key: "all", label: "All", count: photos.length, param: {} }];
  for (const e of editions.values()) {
    out.push(e);
    for (const s of subs.values()) if (photos.some((p) => p.place?.subEditionId === s.param.sub && p.place?.editionId === e.param.edition)) out.push(s);
  }
  // Only worth filtering when there is more than one place
  return out.length > 2 ? out : [];
}

/** Photos of one edition (with its sub-editions) or one sub-edition; all without a filter. */
export function filterPhotos(photos: TitlePhoto[], filter: { edition?: number | null; sub?: number | null }) {
  if (filter.sub) return photos.filter((p) => p.place?.subEditionId === filter.sub);
  if (filter.edition) return photos.filter((p) => p.place?.editionId === filter.edition);
  return photos;
}

/** Previous and next index, wrapping around. */
export function neighbours(index: number, count: number) {
  return { previous: (index - 1 + count) % count, next: (index + 1) % count };
}
