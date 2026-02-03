import { describe, it, expect } from 'vitest';
import { getMainPhoto, getAuthorName, getEditionInfo, Photo, Edition, Work, Publisher, Series } from '../app/lib/editionUtils';

describe('editionUtils', () => {
  it('getMainPhoto returns null for empty or undefined', () => {
    expect(getMainPhoto(undefined)).toBeNull();
    expect(getMainPhoto([])).toBeNull();
  });

  it('getMainPhoto returns smallest sort_order', () => {
    const photos: Photo[] = [
      { id: 1, storage_path: 'a.jpg', sort_order: 2 },
      { id: 2, storage_path: 'b.jpg', sort_order: 1 }
    ];
    const main = getMainPhoto(photos);
    expect(main).not.toBeNull();
    expect(main?.id).toBe(2);
  });

  it('getAuthorName returns author name or fallback', () => {
    const work: Work = { id: 1, original_title: 'T', work_authors: [{ author: { id: 3, name: 'Alice' } }] };
    expect(getAuthorName(work)).toBe('Alice');
    expect(getAuthorName(undefined)).toBe('Unknown Author');
  });

  it('getEditionInfo handles series with matching publisher', () => {
    const editionsList: Edition[] = [
      { id: 10, title: 'E1', publisher: { id: 2, name: 'PubCo' } }
    ];
    const edition: Edition = {
      id: 1,
      title: 'X',
      series: { id: 5, name: 'SeriesX', publisher_id: 2 }
    };
    const info = getEditionInfo(edition, editionsList);
    expect(info).toContain('SeriesX');
    expect(info).toContain('PubCo');
  });

  it('getEditionInfo falls back to publisher or null', () => {
    const editionsList: Edition[] = [];
    const editionWithPublisher: Edition = { id: 2, title: 'Y', publisher: { id: 7, name: 'SoloPub' } };
    expect(getEditionInfo(editionWithPublisher, editionsList)).toContain('SoloPub');

    const editionNone: Edition = { id: 3, title: 'Z' };
    expect(getEditionInfo(editionNone, editionsList)).toBeNull();
  });
});
