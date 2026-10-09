import { describe, it, expect } from 'vitest';
import { periodIndex, pickForPeriod, publisherCountParts, roundedCount, seededShuffle, weekIndex } from '../app/lib/home';

describe('weekIndex and periodIndex', () => {
  it('counts whole weeks from Monday 1 January 2024, changing on Mondays', () => {
    expect(weekIndex(new Date(Date.UTC(2024, 0, 1)))).toBe(0);
    expect(weekIndex(new Date(Date.UTC(2024, 0, 7, 23, 59)))).toBe(0);
    expect(weekIndex(new Date(Date.UTC(2024, 0, 8)))).toBe(1);
  });

  it('groups weeks into periods', () => {
    expect(periodIndex(new Date(Date.UTC(2024, 0, 8)), 2)).toBe(0);
    expect(periodIndex(new Date(Date.UTC(2024, 0, 15)), 2)).toBe(1);
  });
});

describe('seededShuffle', () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8];

  it('gives the same order for the same seed and keeps every item', () => {
    expect(seededShuffle(list, 42)).toEqual(seededShuffle(list, 42));
    expect([...seededShuffle(list, 42)].sort()).toEqual(list);
  });

  it('gives another order for another seed and leaves the input alone', () => {
    expect(seededShuffle(list, 1)).not.toEqual(seededShuffle(list, 2));
    expect(list).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('pickForPeriod', () => {
  it('walks through every item before one comes back', () => {
    const list = ['a', 'b', 'c', 'd'];
    const picks = [0, 1, 2, 3].map((i) => pickForPeriod(list, i));
    expect([...picks].sort()).toEqual(list);
    expect(pickForPeriod(list, 4)).toBe(picks[0]);
  });

  it('returns null for an empty list and handles negative indexes', () => {
    expect(pickForPeriod([], 3)).toBeNull();
    expect(pickForPeriod(['a', 'b'], -1)).not.toBeNull();
  });
});

describe('roundedCount', () => {
  it('rounds down to hundreds with a plus', () => {
    expect(roundedCount(3636)).toBe('3,600+');
    expect(roundedCount(1308)).toBe('1,300+');
    expect(roundedCount(100)).toBe('100+');
  });

  it('keeps small numbers exact', () => {
    expect(roundedCount(43)).toBe('43');
  });
});

describe('roundedCount with a step', () => {
  it('rounds down to thousands for the home band', () => {
    expect(roundedCount(3636, 1000)).toBe('3,000+');
    expect(roundedCount(999, 1000)).toBe('999');
  });
});

describe('publisherCountParts', () => {
  const texts = (p: { titles: number; editions: number; limitedEditions: number }) => publisherCountParts(p).map((x) => x.text);

  it('leaves out editions when every title has one edition', () => {
    expect(texts({ titles: 15, editions: 15, limitedEditions: 29 })).toEqual(['15 titles', '29 limited editions']);
  });

  it('shows editions when they differ from the titles', () => {
    expect(texts({ titles: 2535, editions: 3495, limitedEditions: 20 })).toEqual(['2,535 titles', '3,495 editions', '20 limited editions']);
  });

  it('leaves out limited editions when there are none and uses the singular', () => {
    expect(texts({ titles: 21, editions: 21, limitedEditions: 1 })).toEqual(['21 titles', '1 limited edition']);
    expect(texts({ titles: 1, editions: 1, limitedEditions: 0 })).toEqual(['1 title']);
  });
});
