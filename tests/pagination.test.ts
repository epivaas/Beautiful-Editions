import { describe, it, expect } from 'vitest';
import { getPageItems } from '../app/lib/pagination';
import { getPhotoUrl } from '../app/lib/editionUtils';

describe('getPageItems', () => {
  it('returns nothing for zero pages and a single page for one', () => {
    expect(getPageItems(1, 0)).toEqual([]);
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it('shows every page when there are few', () => {
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses the end when on the first page', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 'ellipsis', 20]);
  });

  it('collapses both sides in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });

  it('collapses the start on the last page', () => {
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis', 19, 20]);
  });

  it('shows a single hidden page instead of an ellipsis', () => {
    expect(getPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
    expect(getPageItems(17, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });

  it('shows only first, current and last page without siblings (phone)', () => {
    expect(getPageItems(7, 20, 0)).toEqual([1, 'ellipsis', 7, 'ellipsis', 20]);
    expect(getPageItems(1, 20, 0)).toEqual([1, 'ellipsis', 20]);
    expect(getPageItems(20, 20, 0)).toEqual([1, 'ellipsis', 20]);
    expect(getPageItems(2, 20, 0)).toEqual([1, 2, 'ellipsis', 20]);
  });

  it('clamps a page outside the range', () => {
    expect(getPageItems(99, 20)).toEqual(getPageItems(20, 20));
    expect(getPageItems(-3, 20)).toEqual(getPageItems(1, 20));
  });
});

describe('getPhotoUrl', () => {
  it('builds a public URL in the Book-photos bucket', () => {
    expect(getPhotoUrl('folio/odyssey.jpg')).toMatch(/\/storage\/v1\/object\/public\/Book-photos\/folio\/odyssey\.jpg$/);
  });
});
