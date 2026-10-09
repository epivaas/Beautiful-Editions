// Pure helpers for the home page: rotation of the spotlights and rounded counts. No Supabase import.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Monday 1 January 2024, 00:00 UTC: weeks are counted from here, starting on Mondays like ISO weeks
const EPOCH = Date.UTC(2024, 0, 1);

/** Number of whole weeks (Monday to Sunday, UTC) since 1 January 2024. */
export function weekIndex(date: Date) {
  return Math.floor((date.getTime() - EPOCH) / WEEK_MS);
}

/** Index of the period of `weeks` weeks that `date` falls in: 1 for the title spotlight, 2 for publishers. */
export function periodIndex(date: Date, weeks: number) {
  return Math.floor(weekIndex(date) / weeks);
}

/** Small deterministic random generator (mulberry32), so a seed always gives the same order. */
function random(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same shuffle for the same seed (Fisher–Yates with a seeded generator). */
export function seededShuffle<T>(list: T[], seed: number): T[] {
  const next = random(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The item for a period: a fixed shuffled order walked one step per period, so every item gets
 * its turn before one comes back. Null for an empty list.
 */
export function pickForPeriod<T>(list: T[], index: number, seed = 1): T | null {
  if (list.length === 0) return null;
  const order = seededShuffle(list, seed);
  return order[((index % order.length) + order.length) % order.length];
}

/**
 * Rounded down to `step` with a plus: "3,000+" for 3,636 (step 1,000), "1,300+" for 1,308 (step 100).
 * Numbers smaller than the step stay exact.
 */
export function roundedCount(n: number, step = 100) {
  if (n < step) return n.toLocaleString("en-US");
  return `${(Math.floor(n / step) * step).toLocaleString("en-US")}+`;
}

type PublisherCounts = { titles: number; editions: number; limitedEditions: number };

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Counts on the publisher spotlight card (DESIGN.md §6): always the titles, the editions only when they
 * differ from the titles (small presses publish each title once), and the limited editions when there are any.
 */
export function publisherCountParts(p: PublisherCounts) {
  return [
    { value: p.titles, text: plural(p.titles, "title") },
    p.editions !== p.titles ? { value: p.editions, text: plural(p.editions, "edition") } : null,
    p.limitedEditions > 0 ? { value: p.limitedEditions, text: plural(p.limitedEditions, "limited edition") } : null,
  ].filter((part): part is { value: number; text: string } => part !== null);
}

/** A fresh seed for "What's new" (a new selection on every visit, or after "Show other editions"). */
export function newSeed() {
  return Math.floor(Math.random() * 1e9) + 1;
}
