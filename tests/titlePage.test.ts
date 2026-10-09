import { describe, it, expect } from 'vitest';
import {
  collectPhotos,
  countLine,
  filterByPublisher,
  limitedLabel,
  publisherCounts,
  sortEditions,
  sortRows,
  summarize,
  toEditionRow,
  type EditionRow,
  type TitleEditionRow,
  type TitlePhotoRow,
  type TitleWorkRow,
} from '../app/lib/titlePage';

const folio = { id: 2, name: 'The Folio Society' };
const suntup = { id: 5, name: 'Suntup Editions' };

function photo(id: number, extra: Partial<TitlePhotoRow> = {}): TitlePhotoRow {
  return { id, storage_path: `p${id}.jpg`, caption: null, copyright_statement: `© ${id}`, is_main: false, sort_order: id, ...extra };
}

function edition(id: number, extra: Partial<TitleEditionRow> = {}): TitleEditionRow {
  return {
    id,
    title: `Edition ${id}`,
    publication_year: 2000 + id,
    language: 'English',
    binding_type: 'Cloth',
    is_limited_edition: false,
    limited_edition_count: null,
    publisher: folio,
    photos: [],
    sub_editions: [],
    edition_contributors: [],
    ...extra,
  };
}

describe('sortEditions', () => {
  it('sorts oldest first, unknown years last, and skips missing editions', () => {
    const work = {
      work_editions: [
        { edition: edition(3) },
        { edition: edition(9, { publication_year: null }) },
        { edition: null },
        { edition: edition(1) },
      ],
    } as unknown as TitleWorkRow;
    expect(sortEditions(work).map((e) => e.id)).toEqual([1, 3, 9]);
  });
});

describe('summarize', () => {
  it('counts editions and publishers and gives the year span and languages', () => {
    const facts = summarize([
      edition(1, { publication_year: 1983 }),
      edition(2, { publication_year: 2022, publisher: suntup, language: 'French' }),
      edition(3, { publication_year: 1996, language: null }),
    ]);
    expect(facts).toEqual({ editions: 3, publishers: 2, years: '1983 to 2022', languages: ['English', 'French'] });
  });

  it('shows a single year once and handles no years', () => {
    expect(summarize([edition(1, { publication_year: 2018 })]).years).toBe('2018');
    expect(summarize([edition(1, { publication_year: null })]).years).toBeNull();
    expect(summarize([]).editions).toBe(0);
  });
});

describe('collectPhotos', () => {
  it('puts main photos first, then newer editions, then sort order, including sub-edition photos', () => {
    const photos = collectPhotos([
      edition(1, { publication_year: 1990, photos: [photo(10), photo(11, { is_main: true })] }),
      edition(2, {
        publication_year: 2010,
        photos: [photo(20, { sort_order: 2 })],
        sub_editions: [{ id: 7, is_limited_edition: true, limited_edition_count: 26, photos: [photo(21, { sort_order: 1 })] }],
      }),
    ]);
    expect(photos.map((p) => p.id)).toEqual([11, 21, 20, 10]);
    expect(photos[0].credit).toBe('© 11');
    expect(photos[0].src).toMatch(/Book-photos\/p11\.jpg$/);
  });

  it('uses the caption as alt text, or the edition title and publisher', () => {
    const [withCaption, without] = collectPhotos([
      edition(1, { photos: [photo(1, { caption: 'Title page', is_main: true }), photo(2)] }),
    ]);
    expect(withCaption.alt).toBe('Title page');
    expect(without.alt).toBe('Edition 1, The Folio Society');
  });
});

describe('limitedLabel', () => {
  it('combines the kind and the count', () => {
    expect(limitedLabel('Lettered', 26)).toBe('Lettered · 26');
    expect(limitedLabel('Numbered', 1500)).toBe('Numbered · 1,500');
    expect(limitedLabel('Named Edition', null)).toBe('Named Edition');
  });

  it('falls back when the kind is unknown', () => {
    expect(limitedLabel(null, 26)).toBe('Edition of 26');
    expect(limitedLabel(undefined, null)).toBe('Limited edition');
  });
});

describe('toEditionRow', () => {
  it('orders variant labels by the kind\'s sort order', () => {
    const row = toEditionRow(
      edition(1, {
        sub_editions: [
          { id: 1, is_limited_edition: true, limited_edition_count: 250, limited_state: { name: 'Numbered', sort_order: 20 }, photos: [] },
          { id: 2, is_limited_edition: true, limited_edition_count: 26, limited_state: { name: 'Lettered', sort_order: 10 }, photos: [] },
          { id: 3, is_limited_edition: true, limited_edition_count: 300, limited_state: null, photos: [] },
        ],
      })
    );
    expect(row.variants).toEqual(['Lettered · 26', 'Numbered · 250', 'Edition of 300']);
  });

  it('splits sub-editions into printings and variant labels', () => {
    const row = toEditionRow(
      edition(1, {
        is_limited_edition: true,
        limited_edition_count: 1500,
        sub_editions: [
          { id: 1, is_limited_edition: false, limited_edition_count: null, photos: [] },
          { id: 2, is_limited_edition: false, limited_edition_count: null, photos: [] },
          { id: 3, is_limited_edition: true, limited_edition_count: 26, photos: [] },
          { id: 4, is_limited_edition: true, limited_edition_count: null, photos: [] },
        ],
      })
    );
    expect(row.printings).toBe(2);
    expect(row.variants).toEqual(['Edition of 1,500', 'Edition of 26', 'Limited edition']);
  });

  it('lists illustrators only, once each, and picks the main photo', () => {
    const row = toEditionRow(
      edition(1, {
        binding_type: '',
        photos: [photo(1), photo(2, { is_main: true })],
        edition_contributors: [
          { role: 'Illustrator', contributor: { id: 1, name: 'Keeping, Charles' } },
          { role: 'Introduction', contributor: { id: 2, name: 'Someone Else' } },
          { role: 'Illustrator', contributor: { id: 1, name: 'Keeping, Charles' } },
        ],
      })
    );
    expect(row.illustrators).toEqual(['Keeping, Charles']);
    expect(row.binding).toBeNull();
    expect(row.photos[0].src).toMatch(/p2\.jpg$/);
    expect(row.photos[0].credit).toBe('© 2');
    expect(row.photoCount).toBe(2);
  });
});

describe('publisherCounts and filterByPublisher', () => {
  const editions = [edition(1), edition(2, { publisher: suntup }), edition(3)];

  it('counts editions per publisher in order of appearance', () => {
    expect(publisherCounts(editions)).toEqual([
      { ...folio, count: 2 },
      { ...suntup, count: 1 },
    ]);
  });

  it('filters by publisher, or returns everything without one', () => {
    expect(filterByPublisher(editions, 5).map((e) => e.id)).toEqual([2]);
    expect(filterByPublisher(editions, null)).toHaveLength(3);
  });
});

describe('toEditionRow card fields', () => {
  it('lists includes in a fixed order, pages and a collapsed note', () => {
    const row = toEditionRow(
      edition(1, {
        dustjacket: true,
        slipcase: true,
        clamshell: false,
        pages_description: 'Pp. [1–9] 10–388.',
        notes: 'Printed by Butler and Tanner.\n\nBound by Mackay.',
      })
    );
    expect(row.includes).toEqual(['Slipcase', 'Dust jacket']);
    expect(row.pages).toBe('Pp. [1–9] 10–388.');
    expect(row.note).toBe('Printed by Butler and Tanner. Bound by Mackay.');
  });

  it('leaves empty fields empty and counts sub-edition photos', () => {
    const row = toEditionRow(
      edition(1, {
        notes: '   ',
        pages_description: '',
        sub_editions: [{ id: 9, is_limited_edition: true, limited_edition_count: 26, photos: [photo(5)] }],
      })
    );
    expect(row.includes).toEqual([]);
    expect(row.pages).toBeNull();
    expect(row.note).toBeNull();
    expect(row.photoCount).toBe(1);
    expect(row.variantCount).toBe(1);
  });
});

function row(id: number, extra: Partial<EditionRow> = {}): EditionRow {
  return {
    id, title: `Edition ${id}`, publisher: folio, year: 2000, binding: null, pages: null, illustrators: [],
    includes: [], note: null, printings: 0, variantCount: 0, variants: [], photos: [], photoCount: 0, ...extra,
  };
}

describe('sortRows', () => {
  const rows = [
    row(1, { year: 1996, title: 'the Odyssey', publisher: suntup }),
    row(2, { year: null, title: 'Anniversary edition' }),
    row(3, { year: 1983, title: 'Ödyssey, illustrated' }),
    row(4, { year: 1996, title: 'Beowulf' }),
  ];
  const ids = (r: EditionRow[]) => r.map((x) => x.id);

  it('sorts by year with unknown years last in both directions, id for ties', () => {
    expect(ids(sortRows(rows, 'year', 'asc'))).toEqual([3, 1, 4, 2]);
    expect(ids(sortRows(rows, 'year', 'desc'))).toEqual([1, 4, 3, 2]);
  });

  it('sorts by publisher, then year; descending reverses both (as on the board)', () => {
    expect(ids(sortRows(rows, 'publisher', 'asc'))).toEqual([1, 3, 4, 2]);
    expect(ids(sortRows(rows, 'publisher', 'desc'))).toEqual([4, 3, 2, 1]);
  });

  it('sorts by name ignoring case and accents', () => {
    expect(ids(sortRows(rows, 'name', 'asc'))).toEqual([2, 4, 3, 1]);
    expect(ids(sortRows(rows, 'name', 'desc'))).toEqual([1, 3, 4, 2]);
  });

  it('does not change the input array', () => {
    const copy = [...rows];
    sortRows(rows, 'name', 'desc');
    expect(rows).toEqual(copy);
  });
});

describe('countLine', () => {
  it('joins variants, printings and photos, with plurals', () => {
    expect(countLine(row(1, { variantCount: 2, printings: 1, photoCount: 18 }))).toBe('2 variants · 1 printing · 18 photos');
    expect(countLine(row(1, { variantCount: 1, photoCount: 1 }))).toBe('1 variant · 1 photo');
  });

  it('leaves out zero parts', () => {
    expect(countLine(row(1, { printings: 3 }))).toBe('3 printings');
    expect(countLine(row(1))).toBe('');
  });
});
