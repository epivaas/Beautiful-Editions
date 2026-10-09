import { describe, it, expect } from 'vitest';
import {
  activeSpan,
  firstLetter,
  fold,
  highlightParts,
  isLetterKey,
  letterCounts,
  matchesFilter,
  overviewHref,
  paginate,
  plural,
  sortableYear,
  sortBy,
  yearSpan,
} from '../app/lib/overview';

describe('fold and firstLetter', () => {
  it('removes accents and case', () => {
    expect(fold('Odýsseia')).toBe('odysseia');
  });

  it('gives the A–Z letter, groups for Greek and Cyrillic, and "other" for the rest', () => {
    expect(firstLetter('Ödyssey')).toBe('O');
    expect(firstLetter('  wuthering')).toBe('W');
    expect(firstLetter('Ὀδύσσεια')).toBe('greek');
    expect(firstLetter('Ἱστορίαι')).toBe('greek');
    expect(firstLetter('Бесы')).toBe('cyrillic');
    expect(firstLetter('1984')).toBe('other');
    expect(firstLetter('תהלים')).toBe('other');
    expect(firstLetter('西遊記')).toBe('other');
    expect(firstLetter(null)).toBe('other');
  });

  it('knows the letter keys used in the URL', () => {
    expect(isLetterKey('N')).toBe(true);
    expect(isLetterKey('greek')).toBe(true);
    expect(isLetterKey('other')).toBe(true);
    expect(isLetterKey('n')).toBe(false);
    expect(isLetterKey(undefined)).toBe(false);
  });

  it('counts rows per letter', () => {
    const counts = letterCounts(['Odyssey', 'Oliver Twist', 'Iliad', '1984'], (t) => t);
    expect(counts.get('O')).toBe(2);
    expect(counts.get('I')).toBe(1);
    expect(counts.get('other')).toBe(1);
    expect(counts.has('Z')).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('matches every word anywhere in the texts, ignoring case and accents', () => {
    expect(matchesFilter(['Odýsseia', 'The Odyssey', 'Homer'], 'odyss homer')).toBe(true);
    expect(matchesFilter(['Odýsseia', 'The Odyssey', 'Homer'], 'odysseia')).toBe(true);
    expect(matchesFilter(['Iliás', null, 'Homer'], 'odyss')).toBe(false);
  });

  it('matches everything with an empty filter', () => {
    expect(matchesFilter(['x'], '')).toBe(true);
    expect(matchesFilter(['x'], '   ')).toBe(true);
    expect(matchesFilter(['x'], undefined)).toBe(true);
  });
});

describe('sortBy', () => {
  const rows = [
    { id: 1, name: 'ödyssey', year: 1996 },
    { id: 2, name: 'Iliad', year: null },
    { id: 3, name: 'Beowulf', year: 1983 },
    { id: 4, name: 'beowulf', year: 1983 },
  ];
  const ids = (r: { id: number }[]) => r.map((x) => x.id);

  it('sorts text ignoring case and accents, id for ties', () => {
    expect(ids(sortBy(rows, (r) => r.name, 'asc'))).toEqual([3, 4, 2, 1]);
    expect(ids(sortBy(rows, (r) => r.name, 'desc'))).toEqual([1, 2, 3, 4]);
  });

  it('sorts numbers and keeps empty values last in both directions', () => {
    expect(ids(sortBy(rows, (r) => r.year, 'asc'))).toEqual([3, 4, 1, 2]);
    expect(ids(sortBy(rows, (r) => r.year, 'desc'))).toEqual([1, 3, 4, 2]);
  });
});

describe('paginate', () => {
  const rows = Array.from({ length: 120 }, (_, i) => i + 1);

  it('returns one page with its range', () => {
    const p = paginate(rows, 2, 50);
    expect(p.rows[0]).toBe(51);
    expect([p.from, p.to, p.total, p.totalPages]).toEqual([51, 100, 120, 3]);
  });

  it('clamps pages outside the range', () => {
    expect(paginate(rows, 99, 50).page).toBe(3);
    expect(paginate(rows, 0, 50).page).toBe(1);
    expect(paginate(rows, NaN, 50).page).toBe(1);
  });

  it('handles an empty list', () => {
    expect(paginate([], 1, 50)).toEqual({ page: 1, totalPages: 1, rows: [], from: 0, to: 0, total: 0 });
  });
});

describe('years', () => {
  it('spans the known years', () => {
    expect(yearSpan([1983, null, 2022, 1996])).toBe('1983 to 2022');
    expect(yearSpan([2018])).toBe('2018');
    expect(yearSpan([null])).toBeNull();
  });

  it('reads a sortable year from free text', () => {
    expect(sortableYear('1605')).toBe(1605);
    expect(sortableYear('c. 700 BC')).toBe(-700);
    expect(sortableYear('1847–48')).toBe(1847);
    expect(sortableYear('unknown')).toBeNull();
    expect(sortableYear(null)).toBeNull();
  });
});

describe('overviewHref', () => {
  const state = { letter: 'O', q: null, sort: 'title', dir: 'asc', page: '3' };
  const defaults = { sort: 'title', dir: 'asc' };

  it('keeps the state, leaves defaults out and resets the page on other changes', () => {
    expect(overviewHref('/titles', state, { letter: 'B' }, defaults)).toBe('/titles?letter=B');
    expect(overviewHref('/titles', state, { sort: 'year', dir: 'desc' }, defaults)).toBe('/titles?letter=O&sort=year&dir=desc');
  });

  it('keeps the other choices when only the page changes', () => {
    expect(overviewHref('/titles', state, { page: '4' }, defaults)).toBe('/titles?letter=O&page=4');
  });

  it('returns the bare path without any state', () => {
    expect(overviewHref('/titles', { letter: 'O' }, { letter: null }, defaults)).toBe('/titles');
  });
});

describe('plural', () => {
  it('formats counts', () => {
    expect(plural(2618, 'title')).toBe('2,618 titles');
    expect(plural(1, 'series', 'series')).toBe('1 series');
  });
});

describe('highlightParts', () => {
  const marked = (parts: { text: string; match: boolean }[]) => parts.filter((p) => p.match).map((p) => p.text);

  it('marks matches in the original spelling, ignoring case and accents', () => {
    expect(marked(highlightParts('Odýsseia', 'odyss'))).toEqual(['Odýss']);
    expect(highlightParts('Odýsseia', 'odyss').map((p) => p.text).join('')).toBe('Odýsseia');
  });

  it('marks every word and every occurrence, merging overlaps', () => {
    expect(marked(highlightParts('The Odyssey of Homer', 'odys homer'))).toEqual(['Odys', 'Homer']);
    expect(marked(highlightParts('banana', 'ana'))).toEqual(['anana']);
  });

  it('returns the whole text unmarked without a filter or without a match', () => {
    expect(highlightParts('Iliad', '')).toEqual([{ text: 'Iliad', match: false }]);
    expect(highlightParts('Iliad', 'odyss')).toEqual([{ text: 'Iliad', match: false }]);
  });

  it('works with Greek and Cyrillic', () => {
    expect(marked(highlightParts('Ὀδύσσεια', 'οδυσ'))).toEqual(['Ὀδύσ']);
    expect(marked(highlightParts('Бесы', 'бес'))).toEqual(['Бес']);
  });
});

describe('overviewHref with letter groups', () => {
  it('puts the group key in the URL', () => {
    expect(overviewHref('/titles', {}, { letter: 'greek' })).toBe('/titles?letter=greek');
  });
});

describe('activeSpan', () => {
  it('says "to now" when the latest year is this year or last year', () => {
    expect(activeSpan([1947, 2026], 2026)).toBe('1947 to now');
    expect(activeSpan([1947, 2025], 2026)).toBe('1947 to now');
  });

  it('gives the span or a single year otherwise, and null without years', () => {
    expect(activeSpan([1997, null, 2009], 2026)).toBe('1997 to 2009');
    expect(activeSpan([2009], 2026)).toBe('2009');
    expect(activeSpan([null], 2026)).toBeNull();
  });
});
