// Pure helpers for "Suggest a change" and the queue. No Supabase import, so they can be unit tested.

export const KINDS = [
  { key: "correction", label: "Correction" },
  { key: "missing", label: "Missing" },
  { key: "note", label: "Note" },
  { key: "photograph", label: "Photograph" },
] as const;
export type Kind = (typeof KINDS)[number]["key"];

export const STATUSES = [
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "spam", label: "Spam" },
] as const;
export type Status = (typeof STATUSES)[number]["key"];

export function isStatus(value: unknown): value is Status {
  return STATUSES.some((s) => s.key === value);
}

/** What the form sends. */
export type SuggestionInput = {
  pagePath?: unknown;
  pageLabel?: unknown;
  field?: unknown;
  kind?: unknown;
  body?: unknown;
  credit?: unknown;
  name?: unknown;
  email?: unknown;
  /** Hidden field: people leave it empty, bots fill it in. */
  website?: unknown;
  /** When the form was opened (ms since 1970). */
  openedAt?: unknown;
};

export type CleanSuggestion = {
  page_path: string;
  page_label: string | null;
  field: string | null;
  kind: Kind;
  body: string;
  name: string | null;
  email: string | null;
  wants_credit: boolean;
};

// Silent spam filters (board Opmerkingen)
export const MIN_SECONDS = 3;
export const MAX_PER_HOUR = 5;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function linkCount(body: string) {
  return (body.match(/https?:\/\/|www\./gi) ?? []).length;
}

/**
 * Checks a submission. "invalid" comes with a message for the visitor; "spam" is answered with a plain
 * "Thank you" and nothing is saved, so a bot learns nothing.
 */
export function checkSuggestion(
  input: SuggestionInput,
  now: number
): { ok: true; row: CleanSuggestion } | { ok: false; reason: "invalid"; message: string } | { ok: false; reason: "spam" } {
  const kind = KINDS.find((k) => k.key === input.kind)?.key;
  const body = text(input.body, 5000);
  const pagePath = text(input.pagePath, 300);
  const credit = input.credit === true;
  const name = text(input.name, 120);
  const email = text(input.email, 254);

  if (!kind) return { ok: false, reason: "invalid", message: "Choose what kind of suggestion this is." };
  if (body.length < 5) return { ok: false, reason: "invalid", message: "Write a few words about what we should correct or add." };
  if (!pagePath.startsWith("/")) return { ok: false, reason: "invalid", message: "We could not tell which page this is about." };
  if (credit && !name) return { ok: false, reason: "invalid", message: "Add the name you want to be credited with." };
  if (credit && !email) return { ok: false, reason: "invalid", message: "Add your e-mail address so we can check it is you." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: "invalid", message: "Check the e-mail address." };

  const openedAt = typeof input.openedAt === "number" ? input.openedAt : Number(input.openedAt);
  const tooFast = !Number.isFinite(openedAt) || now - openedAt < MIN_SECONDS * 1000;
  const tooManyLinks = linkCount(body) > (kind === "photograph" ? 2 : 1);
  if (text(input.website, 200) || tooFast || tooManyLinks) return { ok: false, reason: "spam" };

  return {
    ok: true,
    row: {
      page_path: pagePath,
      page_label: text(input.pageLabel, 300) || null,
      field: text(input.field, 100) || null,
      kind,
      body,
      name: name || null,
      email: email || null,
      wants_credit: credit,
    },
  };
}

/** "12 min ago", "2 h ago", "Yesterday", "3 days ago", then the date. */
export function timeAgo(date: Date, now: Date) {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "Jan Peeters (not verified)", or "Anonymous". */
export function senderLabel(s: { name: string | null; wants_credit: boolean; email_verified: boolean }) {
  if (!s.name) return "Anonymous";
  return `${s.name} (${s.email_verified ? "verified" : "not verified"})${s.wants_credit ? "" : ", anonymous"}`;
}
