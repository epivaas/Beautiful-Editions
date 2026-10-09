import { describe, it, expect } from 'vitest';
import { filterPhotos, neighbours, photoFilters } from '../app/lib/photos';
import type { PhotoPlace, TitlePhoto } from '../app/lib/titlePage';

function p(id: number, place: PhotoPlace | null): TitlePhoto {
  return { id, src: `/p${id}.jpg`, alt: '', credit: null, place };
}
const ed = (editionId: number, label: string): PhotoPlace => ({ label, href: `/edition/${editionId}`, editionId, subEditionId: null });
const sub = (editionId: number, subEditionId: number, label: string): PhotoPlace => ({
  label,
  href: `/sub-editions/${subEditionId}`,
  editionId,
  subEditionId,
});

const photos = [
  p(1, sub(5, 51, 'Suntup 2018 · Lettered edition')),
  p(2, sub(5, 51, 'Suntup 2018 · Lettered edition')),
  p(3, sub(5, 52, 'Suntup 2018 · Numbered edition')),
  p(4, ed(2, 'Folio Society 1996')),
  p(5, ed(5, 'Suntup 2018')),
];

describe('photoFilters', () => {
  it('gives All, then each edition followed by its limited editions, with counts', () => {
    expect(photoFilters(photos).map((f) => `${f.label} ${f.count}`)).toEqual([
      'All 5',
      'Suntup 2018 4',
      'Suntup 2018 · Lettered edition 2',
      'Suntup 2018 · Numbered edition 1',
      'Folio Society 1996 1',
    ]);
  });

  it('gives no chips when all photos belong to one place', () => {
    expect(photoFilters([photos[3]])).toEqual([]);
  });
});

describe('filterPhotos', () => {
  it('filters on an edition (with its sub-editions) or on one sub-edition', () => {
    expect(filterPhotos(photos, { edition: 5 }).map((x) => x.id)).toEqual([1, 2, 3, 5]);
    expect(filterPhotos(photos, { sub: 51 }).map((x) => x.id)).toEqual([1, 2]);
    expect(filterPhotos(photos, {})).toHaveLength(5);
  });
});

describe('helpers', () => {
  it('wraps around at both ends', () => {
    expect(neighbours(0, 5)).toEqual({ previous: 4, next: 1 });
    expect(neighbours(4, 5)).toEqual({ previous: 3, next: 0 });
  });
});
