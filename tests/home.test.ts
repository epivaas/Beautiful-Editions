import { describe, it, expect } from 'vitest';
import {
  activeSpotlight,
  isoDate,
  mergeRecent,
  periodIndex,
  pickForPeriod,
  publisherCountParts,
  recentlyShown,
  roundedCount,
  seededShuffle,
  weekIndex,
  type SpotlightRow,
} from '../app/lib/home';

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

function spot(id: number, extra: Partial<SpotlightRow>): SpotlightRow {
  return { id, kind: 'title', work_id: 1, publisher_id: null, starts_on: '2026-10-05', ends_on: null, text: null, ...extra };
}

describe('activeSpotlight', () => {
  it('lasts one period without an end date: a week for a title, two weeks for a publisher', () => {
    const t = spot(1, { starts_on: '2026-10-05' });
    expect(activeSpotlight([t], 'title', '2026-10-11')?.id).toBe(1);
    expect(activeSpotlight([t], 'title', '2026-10-12')).toBeNull();
    const p = spot(2, { kind: 'publisher', work_id: null, publisher_id: 5, starts_on: '2026-10-05' });
    expect(activeSpotlight([p], 'publisher', '2026-10-18')?.id).toBe(2);
    expect(activeSpotlight([p], 'publisher', '2026-10-19')).toBeNull();
  });

  it('respects ends_on, ignores future rows and other kinds', () => {
    const pinned = spot(1, { starts_on: '2026-01-01', ends_on: '2099-12-31', text: 'Pinned' });
    expect(activeSpotlight([pinned], 'title', '2026-10-09')?.text).toBe('Pinned');
    expect(activeSpotlight([spot(2, { starts_on: '2026-11-01' })], 'title', '2026-10-09')).toBeNull();
    expect(activeSpotlight([pinned], 'publisher', '2026-10-09')).toBeNull();
  });

  it('prefers the latest start, then the highest id', () => {
    const rows = [
      spot(1, { starts_on: '2026-10-01', ends_on: '2026-12-31' }),
      spot(2, { starts_on: '2026-10-08', ends_on: '2026-12-31' }),
      spot(3, { starts_on: '2026-10-08', ends_on: '2026-12-31' }),
    ];
    expect(activeSpotlight(rows, 'title', '2026-10-09')?.id).toBe(3);
  });
});

describe('recentlyShown', () => {
  it('collects titles or publishers planned in the last eight weeks', () => {
    const rows = [
      spot(1, { work_id: 10, starts_on: '2026-09-01' }),
      spot(2, { work_id: 11, starts_on: '2026-07-01' }),
      spot(3, { kind: 'publisher', work_id: null, publisher_id: 5, starts_on: '2026-10-01' }),
    ];
    expect([...recentlyShown(rows, 'title', '2026-10-09')]).toEqual([10]);
    expect([...recentlyShown(rows, 'publisher', '2026-10-09')]).toEqual([5]);
  });
});

describe('mergeRecent and isoDate', () => {
  it('tops up recent editions with the newest by id, without duplicates', () => {
    expect(mergeRecent([{ id: 9 }], [{ id: 12 }, { id: 9 }, { id: 8 }], 4).map((e) => e.id)).toEqual([9, 12, 8]);
    expect(mergeRecent([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], [{ id: 9 }], 4)).toHaveLength(4);
  });

  it('formats a UTC date', () => {
    expect(isoDate(new Date(Date.UTC(2026, 9, 9, 23, 30)))).toBe('2026-10-09');
  });
});
