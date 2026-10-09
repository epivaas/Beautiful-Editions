import { describe, it, expect } from 'vitest';
import { authorCounts, authorTitleRows, titlesPerPublisher, type AuthorEditionLink, type AuthorWork } from '../app/lib/authorPage';

const folio = { id: 2, name: 'The Folio Society ' };
const suntup = { id: 5, name: 'Suntup Editions' };
const works: AuthorWork[] = [
  { id: 1, original_title: 'Ὀδύσσεια', english_title: 'The Odyssey', original_publication_year: 'c. 700 BC', sort_title: 'Odysseia' },
  { id: 2, original_title: 'Ἰλιάς', english_title: 'The Iliad', original_publication_year: null, sort_title: 'Ilias' },
  { id: 3, original_title: 'Hymns', english_title: 'hymns', original_publication_year: '1600', sort_title: null },
];
const links: AuthorEditionLink[] = [
  { workId: 1, editionId: 10, publisher: folio },
  { workId: 1, editionId: 11, publisher: suntup },
  { workId: 1, editionId: 12, publisher: folio },
  { workId: 2, editionId: 10, publisher: folio },
  { workId: 2, editionId: 13, publisher: null },
];

describe('authorTitleRows', () => {
  const rows = authorTitleRows(works, links);

  it('sorts on the sort title and counts editions and publishers per title', () => {
    expect(rows.map((r) => r.id)).toEqual([3, 2, 1]);
    const odyssey = rows.find((r) => r.id === 1)!;
    expect(odyssey.editions).toBe(3);
    expect(odyssey.publishers.map((p) => p.name)).toEqual(['Suntup Editions', 'The Folio Society']);
    expect(odyssey.firstYear).toBe(-700);
  });

  it('hides an English title that only repeats the original', () => {
    expect(rows.find((r) => r.id === 3)!.englishTitle).toBeNull();
    expect(rows.find((r) => r.id === 1)!.englishTitle).toBe('The Odyssey');
  });

  it('counts titles (not editions) per publisher, most first', () => {
    expect(titlesPerPublisher(rows)).toEqual([
      { id: 2, name: 'The Folio Society', titles: 2 },
      { id: 5, name: 'Suntup Editions', titles: 1 },
    ]);
  });

  it('counts titles, publishers and distinct editions for the Gloed block', () => {
    // Edition 10 contains both titles: counted once
    expect(authorCounts(rows, links)).toEqual({ titles: 3, publishers: 2, editions: 4 });
  });
});
