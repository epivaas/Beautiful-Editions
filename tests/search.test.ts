import { describe, it, expect } from 'vitest';
import {
  criteriaLabels,
  criteriaParams,
  facetCounts,
  filterEditions,
  hasCriteria,
  parseCriteria,
  quickSearch,
  suggestFor,
  type EditionSearchRow,
} from '../app/lib/search';

const lists = {
  titles: [
    { id: 1, title: 'Ὀδύσσεια', englishTitle: 'Odyssey', authors: [{ name: 'Homer' }], editions: 9 },
    { id: 2, title: 'Ἰλιάς', englishTitle: 'Iliad', authors: [{ name: 'Homer' }], editions: 8 },
    { id: 3, title: 'The Homecoming', englishTitle: null, authors: [{ name: 'Pinter, Harold' }], editions: 1 },
  ],
  authors: [
    { id: 10, name: 'Homer', titles: 2 },
    { id: 11, name: 'Holmes, Richard', titles: 1 },
  ],
  publishers: [{ id: 2, name: 'The Folio Society', editions: 3495 }],
};

describe('quickSearch', () => {
  it('needs at least two characters', () => {
    expect(quickSearch(lists, 'h').total).toBe(0);
  });

  it('groups matches by kind, with totals', () => {
    const r = quickSearch(lists, 'hom');
    expect(r.titles.total).toBe(3);
    expect(r.authors.items.map((a) => a.name)).toEqual(['Homer']);
    expect(r.publishers.total).toBe(0);
    expect(r.total).toBe(4);
  });

  it('puts names that start with the query first, and finds English titles', () => {
    const withStart = { ...lists, authors: [{ id: 20, name: 'Ahomer, X', titles: 1 }, ...lists.authors] };
    expect(quickSearch(withStart, 'hom').authors.items.map((a) => a.name)).toEqual(['Homer', 'Ahomer, X']);
    expect(quickSearch(lists, 'odyss').titles.items.map((t) => t.id)).toEqual([1]);
  });

  it('ranks title matches above author matches, and word starts above matches inside a word', () => {
    const more = {
      ...lists,
      titles: [
        ...lists.titles,
        { id: 4, title: 'A Laodicean', englishTitle: null, authors: [{ name: 'Hardy, Thomas' }], editions: 1 },
        { id: 5, title: 'Coming Home', englishTitle: null, authors: [{ name: 'Pilcher, Rosamunde' }], editions: 1 },
      ],
    };
    // "The Homecoming" and "Coming Home": a word starts with "hom"; the Greek titles: their author does;
    // "A Laodicean": only inside "Thomas"
    expect(quickSearch(more, 'hom', 10).titles.items.map((t) => t.id)).toEqual([5, 3, 2, 1, 4]);
  });

  it('limits each group', () => {
    expect(quickSearch(lists, 'hom', 1).titles.items).toHaveLength(1);
  });
});

function ed(id: number, extra: Partial<EditionSearchRow> = {}): EditionSearchRow {
  return {
    id,
    title: `Edition ${id}`,
    publisher: { id: 2, name: 'The Folio Society' },
    seriesId: null,
    year: 1990,
    language: 'English',
    binding: 'Full cloth',
    illustrators: [],
    authors: [],
    workTitles: [],
    limited: false,
    slipcase: false,
    hasPhotos: false,
    ...extra,
  };
}

describe('criteria', () => {
  it('parses the URL and ignores empty or invalid values', () => {
    const c = parseCriteria({ title: ' odyssey ', publisher: '2', from: 'abc', slipcase: '1', photos: '0' });
    expect(c.title).toBe('odyssey');
    expect(c.publisher).toBe(2);
    expect(c.from).toBeNull();
    expect(c.slipcase).toBe(true);
    expect(c.photos).toBe(false);
    expect(hasCriteria(c)).toBe(true);
    expect(hasCriteria(parseCriteria({}))).toBe(false);
  });

  it('writes only the set criteria back to the URL', () => {
    expect(criteriaParams(parseCriteria({ author: 'Homer', to: '2000', limited: '1' }))).toEqual({
      author: 'Homer',
      to: '2000',
      limited: '1',
    });
  });
});

describe('filterEditions', () => {
  const rows = [
    ed(1, { workTitles: ['Odýsseia'], authors: ['Homer'], illustrators: ['Doré, Gustave'], slipcase: true, year: 1996 }),
    ed(2, { year: 2010, limited: true, hasPhotos: true, publisher: { id: 5, name: 'Suntup Editions' } }),
    ed(3, { year: null, binding: 'Quarter leather', seriesId: 7 }),
  ];
  const ids = (q: Record<string, string>) => filterEditions(rows, parseCriteria(q)).map((e) => e.id);

  it('matches text fields at the start of a word, ignoring accents', () => {
    expect(ids({ title: 'odyss' })).toEqual([1]);
    expect(ids({ illustrator: 'dore' })).toEqual([1]);
    expect(ids({ illustrator: 'gustave dor' })).toEqual([1]);
    expect(ids({ binding: 'leather' })).toEqual([3]);
    expect(ids({ binding: 'eather' })).toEqual([]);
  });

  it('does not find a name inside another word', () => {
    const kings = [ed(1, { authors: ['King, Stephen'] }), ed(2, { authors: ['Hawking, Stephen'] })];
    expect(filterEditions(kings, parseCriteria({ author: 'King, Stephen' })).map((e) => e.id)).toEqual([1]);
  });

  it('filters on publisher, series, years and the check boxes', () => {
    expect(ids({ publisher: '5' })).toEqual([2]);
    expect(ids({ series: '7' })).toEqual([3]);
    expect(ids({ from: '2000' })).toEqual([2]);
    expect(ids({ to: '2000' })).toEqual([1]);
    expect(ids({ limited: '1', photos: '1' })).toEqual([2]);
    expect(ids({ slipcase: '1' })).toEqual([1]);
  });

  it('returns everything without criteria', () => {
    expect(ids({})).toEqual([1, 2, 3]);
  });
});

describe('facets', () => {
  const suntup = { id: 5, name: 'Suntup Editions' };
  const folio = { id: 2, name: 'The Folio Society' };
  const rows = [
    ed(1, { publisher: suntup, seriesId: 70, authors: ['Bradbury, Ray'], language: 'English' }),
    ed(2, { publisher: suntup, seriesId: 71, authors: ['Matheson, Richard'] }),
    ed(3, { publisher: suntup, seriesId: null, authors: ['King, Stephen'], illustrators: ['Wrightson, Bernie'] }),
    ed(4, { publisher: suntup, seriesId: null, authors: ['King, Stephen'], illustrators: ['Wrightson, Bernie'] }),
    ed(5, { publisher: folio, seriesId: 20, authors: ['King, Stephen'], illustrators: ['Kirby, Josh'], language: 'French' }),
  ];
  const names = new Map([
    ['70', 'Classic Editions'],
    ['71', 'Fine Press'],
    ['20', 'Folio Horror'],
    ['5', 'Suntup Editions'],
    ['2', 'The Folio Society'],
  ]);
  const c = (q: Record<string, string>) => parseCriteria(q);

  it('only offers series that still give results with the other criteria', () => {
    expect(facetCounts(rows, c({ publisher: '5', author: 'King, Stephen' }), 'series', names)).toEqual([]);
    expect(facetCounts(rows, c({ author: 'King, Stephen' }), 'series', names)).toEqual([
      { value: '20', label: 'Folio Horror', count: 1 },
    ]);
  });

  it('ignores its own field, so the other choices stay visible, with counts', () => {
    expect(facetCounts(rows, c({ publisher: '5', author: 'King' }), 'publisher', names)).toEqual([
      { value: '5', label: 'Suntup Editions', count: 2 },
      { value: '2', label: 'The Folio Society', count: 1 },
    ]);
    expect(facetCounts(rows, c({}), 'language').map((o) => [o.value, o.count])).toEqual([
      ['English', 4],
      ['French', 1],
    ]);
  });

  it('keeps the chosen value, even when it gives nothing', () => {
    expect(facetCounts(rows, c({ series: '70', author: 'King, Stephen' }), 'series', names)).toEqual([
      { value: '70', label: 'Classic Editions', count: 0 },
      { value: '20', label: 'Folio Horror', count: 1 },
    ]);
  });

  it('suggests only values from editions that meet the other criteria, with counts', () => {
    expect(suggestFor(rows, c({ publisher: '5' }), 'illustrator', 'ki')).toEqual([]);
    expect(suggestFor(rows, c({}), 'illustrator', 'ki')).toEqual([{ value: 'Kirby, Josh', count: 1 }]);
    expect(suggestFor(rows, c({ publisher: '5', author: 'Bradbury' }), 'author', 'king')).toEqual([
      { value: 'King, Stephen', count: 2 },
    ]);
  });

  it('puts values that start with the query first and respects the limit', () => {
    const more = [
      ed(10, { illustrators: ['Adoré, X', 'Doré, Gustave', 'Smith, Dora'] }),
      ed(11, { illustrators: ['Doré, Gustave'] }),
    ];
    expect(suggestFor(more, c({}), 'illustrator', 'dor')).toEqual([
      { value: 'Doré, Gustave', count: 2 },
      { value: 'Smith, Dora', count: 1 },
    ]);
    expect(suggestFor(more, c({}), 'illustrator', '')).toEqual([]);
    expect(suggestFor(more, c({}), 'illustrator', 'dor', 1)).toHaveLength(1);
  });
});

describe('criteriaLabels', () => {
  const names = { publishers: [{ id: 2, name: 'The Folio Society' }], series: [] };
  it('turns the set criteria into short labels', () => {
    expect(criteriaLabels(parseCriteria({ from: '2008', to: '2008', binding: 'Full leather', publisher: '2', slipcase: '1' }), names)).toEqual([
      'The Folio Society',
      'Full leather',
      '2008',
      'With slipcase',
    ]);
    expect(criteriaLabels(parseCriteria({ from: '1990' }), names)).toEqual(['From 1990']);
    expect(criteriaLabels(parseCriteria({}), names)).toEqual([]);
  });
});
