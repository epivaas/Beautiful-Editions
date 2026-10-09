import { describe, it, expect } from 'vitest';
import { getMainPhoto, Photo } from '../app/lib/editionUtils';

describe('editionUtils', () => {
  it('getMainPhoto returns null for empty or undefined', () => {
    expect(getMainPhoto(undefined)).toBeNull();
    expect(getMainPhoto([])).toBeNull();
  });

  it('getMainPhoto returns smallest sort_order when no is_main', () => {
    const photos: Photo[] = [
      { id: 1, storage_path: 'a.jpg', sort_order: 2, is_main: false },
      { id: 2, storage_path: 'b.jpg', sort_order: 1, is_main: false }
    ];
    const main = getMainPhoto(photos);
    expect(main).not.toBeNull();
    expect(main?.id).toBe(2);
  });

  it('getMainPhoto prefers photo with is_main true', () => {
    const photos: Photo[] = [
      { id: 1, storage_path: 'a.jpg', sort_order: 1, is_main: false },
      { id: 2, storage_path: 'b.jpg', sort_order: 2, is_main: true }
    ];
    const main = getMainPhoto(photos);
    expect(main).not.toBeNull();
    expect(main?.id).toBe(2);
  });

});
