import { describe, it, expect } from 'vitest';
import {
  bandCounts,
  containsTitles,
  contributorsByRole,
  limitedEditionName,
  parsePrinting,
  toLimitedCards,
  toPrintingRow,
  toPrintingRows,
  worksOf,
  type EditionSubRow,
  type EditionWorkRow,
} from '../app/lib/editionPage';

function sub(id: number, extra: Partial<EditionSubRow> = {}): EditionSubRow {
  return {
    id,
    impression_label: null,
    sequence_number: id,
    catalogue_number: null,
    isbn: null,
    binding_type: null,
    size_dimensions: null,
    typeface: null,
    slipcase: false,
    dustjacket: false,
    clamshell: false,
    is_limited_edition: false,
    limited_edition_count: null,
    limited_state: null,
    publisher_url: null,
    details: null,
    photos: [],
    ...extra,
  };
}

function work(id: number, title: string): EditionWorkRow {
  return { id, original_title: title, english_title: null, work_authors: [] };
}

describe('limitedEditionName', () => {
  it('adds "edition" to the kind', () => {
    expect(limitedEditionName('Lettered', null)).toBe('Lettered edition');
    expect(limitedEditionName('Limited', 'Limited to 1000 copies')).toBe('Limited edition');
  });

  it('keeps names that already end in Edition or State', () => {
    expect(limitedEditionName('Standard State', null)).toBe('Standard State');
    expect(limitedEditionName('Deluxe Edition', null)).toBe('Deluxe Edition');
  });

  it('uses the own name of a Named Edition', () => {
    expect(limitedEditionName('Named Edition', 'Hyde Edition: inspired by the twisted character of Mr Hyde.')).toBe('Hyde Edition');
    expect(limitedEditionName('Named Edition', 'Black covers, white ink')).toBe('Named edition');
  });

  it('falls back to "Limited edition" without a kind', () => {
    expect(limitedEditionName(null, 'Numbered Edition: limited to 300 copies')).toBe('Limited edition');
  });
});

describe('parsePrinting', () => {
  it('splits ordinal printings into name, year and differences', () => {
    expect(parsePrinting('Second printing: 2004 (blue cloth).')).toEqual({ name: 'Second printing', year: 2004, differences: 'blue cloth' });
    expect(parsePrinting('First printing: 2003.')).toEqual({ name: 'First printing', year: 2003, differences: null });
  });

  it('handles impressions, brackets and numerals', () => {
    expect(parsePrinting('[Third impression]: 1997. See item 891, in eight volumes.').name).toBe('Third impression');
    expect(parsePrinting('2nd reprint: 1985').name).toBe('2nd reprint');
  });

  it('keeps other labels whole and still finds the year', () => {
    expect(parsePrinting('Regular Edition')).toEqual({ name: 'Regular Edition', year: null, differences: null });
    expect(parsePrinting('A promotional edition was also published in 2003 as a hardcover.').year).toBe(2003);
  });
});

describe('toPrintingRow', () => {
  it('collects own facts and leaves empty ones out', () => {
    const row = toPrintingRow(
      sub(1, { impression_label: 'Second printing: 1999.', binding_type: 'Blue cloth', slipcase: true, catalogue_number: 'FS-12' }),
      'The Odyssey'
    );
    expect(row.facts).toEqual([
      { label: 'Binding', value: 'Blue cloth' },
      { label: 'Includes', value: 'Slipcase' },
      { label: 'Catalogue no.', value: 'FS-12' },
    ]);
    expect(row.expandable).toBe(true);
  });

  it('is not expandable when everything fits in the row', () => {
    const row = toPrintingRow(sub(1, { impression_label: 'Third printing: 2004.' }), 'The Odyssey');
    expect(row.facts).toEqual([]);
    expect(row.expandable).toBe(false);
  });

  it('is expandable for a long description', () => {
    const label = 'Dust-jacket with the back flap blank, which appears to be a later state of the jacket found on some copies.';
    expect(toPrintingRow(sub(1, { impression_label: label }), 'X').expandable).toBe(true);
  });
});

describe('toLimitedCards and toPrintingRows', () => {
  const subs = [
    sub(1, { is_limited_edition: true, limited_edition_count: 250, limited_state: { name: 'Numbered', sort_order: 20 } }),
    sub(2, { is_limited_edition: true, limited_edition_count: 26, limited_state: { name: 'Lettered', sort_order: 10 } }),
    sub(3, { impression_label: 'Second printing: 1999.', sequence_number: 5 }),
    sub(4, { impression_label: 'First printing: 1997.', sequence_number: 2 }),
    sub(5, { is_limited_edition: true, limited_edition_count: null }),
  ];

  it('orders limited cards by kind and labels the print run', () => {
    const cards = toLimitedCards(subs, 'The Odyssey');
    expect(cards.map((c) => c.name)).toEqual(['Lettered edition', 'Numbered edition', 'Limited edition']);
    expect(cards.map((c) => c.copies)).toEqual(['Edition of 26', 'Edition of 250', null]);
    expect(cards[0].href).toBe('/sub-editions/2');
  });

  it('keeps only non-limited sub-editions as printings, in sequence order', () => {
    expect(toPrintingRows(subs, 'The Odyssey').map((r) => r.id)).toEqual([4, 3]);
  });
});

describe('bandCounts', () => {
  it('shows titles first for an edition with several titles', () => {
    expect(bandCounts({ titles: 7, limited: 0, printings: 2, photos: 9 })).toEqual({
      value: 7,
      label: 'titles',
      lines: ['2 printings', '9 photos'],
    });
  });

  it('shows limited editions with printings and photos underneath', () => {
    expect(bandCounts({ titles: 1, limited: 3, printings: 1, photos: 18 })).toEqual({
      value: 3,
      label: 'limited editions',
      lines: ['1 printing', '18 photos'],
    });
    expect(bandCounts({ titles: 1, limited: 1, printings: 0, photos: 0 })?.label).toBe('limited edition');
  });

  it('shows printings when there are no limited editions', () => {
    expect(bandCounts({ titles: 1, limited: 0, printings: 4, photos: 1 })).toEqual({ value: 4, label: 'printings', lines: ['1 photo'] });
  });

  it('counts photos when there are no limited editions or printings', () => {
    expect(bandCounts({ titles: 1, limited: 0, printings: 0, photos: 5 })).toEqual({ value: 5, label: 'photos', lines: [] });
    expect(bandCounts({ titles: 1, limited: 0, printings: 0, photos: 1 })?.label).toBe('photo');
  });

  it('returns null when there is nothing to count (the page shows an empty Gloed block)', () => {
    expect(bandCounts({ titles: 1, limited: 0, printings: 0, photos: 0 })).toBeNull();
    expect(bandCounts({ titles: 0, limited: 0, printings: 0, photos: 0 })).toBeNull();
  });
});

describe('worksOf and containsTitles', () => {
  const works = worksOf({
    work_editions: [
      { id: 3, work: work(30, 'Iliás') },
      { id: 1, work: work(10, 'Odýsseia') },
      { id: 2, work: null },
    ],
  });

  it('orders titles by link and skips missing ones', () => {
    expect(works.map((w) => w.id)).toEqual([10, 30]);
  });

  it('marks the title you came from', () => {
    const { current, titles } = containsTitles(works, 30);
    expect(current?.id).toBe(30);
    expect(titles).toEqual([
      { id: 10, title: 'Odýsseia', current: false },
      { id: 30, title: 'Iliás', current: true },
    ]);
  });

  it('falls back to the first title when "from" is not in the edition', () => {
    expect(containsTitles(works, 999).current?.id).toBe(10);
    expect(containsTitles(works, null).current?.id).toBe(10);
    expect(containsTitles([], 5).current).toBeNull();
  });
});

describe('contributorsByRole', () => {
  it('groups names per role, each name once', () => {
    const role = contributorsByRole([
      { role: 'Illustrator', contributor: { id: 1, name: 'Doré, Gustave' } },
      { role: 'Illustrator', contributor: { id: 1, name: 'Doré, Gustave' } },
      { role: 'Translator', contributor: { id: 2, name: 'Fagles, Robert' } },
      { role: 'Editor', contributor: null },
    ]);
    expect(role('Illustrator')).toEqual(['Doré, Gustave']);
    expect(role('Translator')).toEqual(['Fagles, Robert']);
    expect(role('Editor')).toEqual([]);
  });
});
