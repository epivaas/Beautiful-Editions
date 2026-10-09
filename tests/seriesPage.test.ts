import { describe, it, expect } from 'vitest';
import { seriesRows, withoutSeriesName, type SeriesEditionRow } from '../app/lib/seriesPage';

function ed(id: number, year: number | null, no: number | null, authors: string[] = []): SeriesEditionRow {
  return {
    id,
    title: ` Volume ${id} `,
    publication_year: year,
    sequence_number: no,
    work_editions: [{ work: { work_authors: authors.map((name) => ({ author: { name } })) } }],
  };
}

describe('seriesRows', () => {
  const rows = seriesRows(
    [ed(1, 2027, 3), ed(2, 2025, 2, ['Herbert, Frank']), ed(3, 2025, 1, ['Herbert, Frank', 'Herbert, Frank']), ed(4, null, 4)],
    2026
  );

  it('orders by year, then number; unknown years after known ones, announced volumes last', () => {
    expect(rows.map((r) => r.id)).toEqual([3, 2, 4, 1]);
  });

  it('marks volumes after this year as announced', () => {
    expect(rows.filter((r) => r.announced).map((r) => r.id)).toEqual([1]);
  });

  it('lists each author once and trims the title', () => {
    expect(rows[0]).toMatchObject({ title: 'Volume 3', authors: ['Herbert, Frank'] });
  });
});

describe('withoutSeriesName', () => {
  it('drops the series name in front of a title', () => {
    expect(withoutSeriesName('The Letterpress Shakespeare: The Tempest', 'The Letterpress Shakespeare')).toBe('The Tempest');
    expect(withoutSeriesName('The Letterpress Shakespeare, the Winter’s Tale', 'The Letterpress Shakespeare')).toBe('The Winter’s Tale');
  });

  it('keeps titles that only are, or do not start with, the series name', () => {
    expect(withoutSeriesName('Dune', 'Dune')).toBe('Dune');
    expect(withoutSeriesName('Dune Messiah', 'Dune')).toBe('Dune Messiah');
    expect(withoutSeriesName('Children of (Dune)', 'Children (of')).toBe('Children of (Dune)');
  });
});
