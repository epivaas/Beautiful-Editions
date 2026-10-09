import { describe, it, expect } from 'vitest';
import {
  groupPage,
  pageOfYear,
  publisherTitleRows,
  sortTitleRows,
  yearCounts,
  yearTicks,
  type PublisherEdition,
  type PublisherWork,
} from '../app/lib/publisherPage';

const works: PublisherWork[] = [
  { id: 1, title: 'Odyssey', englishTitle: null, sortTitle: 'Odyssey', authors: [{ id: 9, name: 'Homer' }] },
  { id: 2, title: 'Iliad', englishTitle: null, sortTitle: 'Iliad', authors: [{ id: 9, name: 'Homer' }] },
  { id: 3, title: 'Beowulf', englishTitle: null, sortTitle: 'Beowulf', authors: [] },
];
const editions: PublisherEdition[] = [
  { id: 10, year: 1998, workIds: [1], illustrators: ['Doré, Gustave'] },
  { id: 11, year: 1998, workIds: [1], illustrators: ['Flaxman, John', 'Doré, Gustave'] },
  { id: 12, year: 1998, workIds: [2, 1], illustrators: [] },
  { id: 13, year: 2005, workIds: [3], illustrators: [] },
  { id: 14, year: null, workIds: [2], illustrators: [] },
  { id: 15, year: 2005, workIds: [99], illustrators: [] },
];

describe('publisherTitleRows', () => {
  const rows = publisherTitleRows(editions, works);

  it('makes one row per title per year and counts its editions', () => {
    expect(rows).toHaveLength(4);
    const odyssey = rows.find((r) => r.workId === 1)!;
    expect(odyssey).toMatchObject({ year: 1998, editions: 3, editionId: null });
    expect(odyssey.illustrators).toEqual(['Doré, Gustave', 'Flaxman, John']);
  });

  it('links straight to the edition when a title has only one that year', () => {
    expect(rows.find((r) => r.workId === 3)).toMatchObject({ editions: 1, editionId: 13 });
  });

  it('counts titles per known year for the bar', () => {
    expect(yearCounts(rows)).toEqual([
      { year: 1998, count: 2 },
      { year: 2005, count: 1 },
    ]);
  });
});

describe('sorting and pages', () => {
  const sorted = sortTitleRows(publisherTitleRows(editions, works));

  it('puts the newest year first, A–Z within a year and the unknown year last', () => {
    expect(sorted.map((r) => `${r.year}:${r.title}`)).toEqual(['2005:Beowulf', '1998:Iliad', '1998:Odyssey', 'null:Iliad']);
    expect(sortTitleRows(sorted, 'asc').map((r) => r.year)).toEqual([1998, 1998, 2005, null]);
  });

  it('finds the page on which a year starts', () => {
    expect(pageOfYear(sorted, 1998, 1)).toBe(2);
    expect(pageOfYear(sorted, 1500, 1)).toBe(1);
  });

  it('puts a heading before each year and repeats it, marked continued, on the next page', () => {
    expect(groupPage(sorted, 0, 2).map((i) => (i.kind === 'year' ? `[${i.year} ${i.count}]` : i.row.title))).toEqual([
      '[2005 1]',
      'Beowulf',
      '[1998 2]',
      'Iliad',
    ]);
    const next = groupPage(sorted, 2, 2);
    expect(next[0]).toEqual({ kind: 'year', year: 1998, count: 2, continued: true });
    expect(next.filter((i) => i.kind === 'year').map((i) => i.kind === 'year' && i.year)).toEqual([1998, null]);
  });
});

describe('yearTicks', () => {
  it('labels every year when there is room, otherwise every 2, 5 or 10 years', () => {
    expect(yearTicks(2018, 2021, 40)).toEqual([2018, 2019, 2020, 2021]);
    // 24 px per year (fixed bars): every 2 years
    expect(yearTicks(2013, 2026, 24)).toEqual([2014, 2016, 2018, 2020, 2022, 2024, 2026]);
    // Folio on a desktop (about 15 px per year) and on a phone (about 4 px)
    expect(yearTicks(1947, 2026, 15)).toEqual([1950, 1955, 1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025]);
    expect(yearTicks(1947, 2026, 4)).toEqual([1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]);
  });
});
