"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { KINDS, type Kind } from "@/app/lib/suggestions";
import { Button } from "./Button";

type SuggestDialogProps = {
  onClose: () => void;
  initialKind?: Kind;
};

const FIELD =
  "w-full rounded-ctl border border-leeg bg-oppervlak px-3.5 text-[15px] text-creme placeholder:text-creme-gedempt focus:border-amber focus:outline-none";
const LABEL = "text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt";

/** Title of the current page without " · Shelfhound": "Lettered edition · Ready Player One". */
function pageLabel() {
  return document.title.replace(/\s*·\s*Shelfhound\s*$/, "").trim();
}

/**
 * "Suggest a change" (board Opmerkingen, step 2 and 3): one field to write in, the kind, optionally a name.
 * No account. After sending: thanks and a reference number, without promising publication.
 */
export default function SuggestDialog({ onClose, initialKind = "correction" }: SuggestDialogProps) {
  const pathname = usePathname();
  const titleId = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [openedAt] = useState(() => Date.now());
  const [label] = useState(() => (typeof document !== "undefined" ? pageLabel() : ""));
  const [kind, setKind] = useState<Kind>(initialKind);
  const [body, setBody] = useState("");
  const [credit, setCredit] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: number | null } | null>(null);

  useEffect(() => {
    textarea.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagePath: pathname, pageLabel: label, kind, body, credit, name, email, website, openedAt }),
      });
      const data = (await res.json()) as { id?: number | null; error?: string };
      if (!res.ok) setError(data.error ?? "Something went wrong. Please try again.");
      else setDone({ id: data.id ?? null });
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-inkt/80 sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-full w-full max-w-[600px] flex-col gap-5 overflow-y-auto rounded-t-card border border-lijn bg-cocoa p-5 sm:rounded-card sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="m-0 text-[28px] leading-[34px]">
            {done ? "Thank you" : "Suggest a change"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-2xl hover:bg-creme/10"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-start gap-4">
            <p className="m-0 text-[15px] leading-6 text-creme-gedempt">
              We read every suggestion. If we have a question, we will reply by e-mail to the address you gave. When we use
              your suggestion, we mention you by the name you gave. Nothing is published before we have checked it.
            </p>
            {done.id !== null && (
              <p className="m-0 text-sm">
                Reference: <span className="font-mono">#{done.id}</span>
              </p>
            )}
            <Button onClick={onClose}>Back to the page</Button>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-5">
            {label && (
              <p className="m-0 text-sm text-creme-gedempt">
                About: <span className="text-creme">{label}</span>
              </p>
            )}

            <div role="radiogroup" aria-label="Kind of suggestion" className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  role="radio"
                  aria-checked={kind === k.key}
                  onClick={() => setKind(k.key)}
                  className={`inline-flex min-h-11 items-center rounded-ctl border px-4 text-sm transition-colors ${
                    kind === k.key ? "border-amber bg-amber font-bold text-inkt" : "border-lijn bg-oppervlak font-medium hover:bg-rij-hover"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sg-body" className={LABEL}>
                What should we correct or add?
              </label>
              <textarea
                id="sg-body"
                ref={textarea}
                required
                minLength={5}
                maxLength={5000}
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  kind === "photograph"
                    ? "Link to the photo, who made it, and the source."
                    : "What is wrong or missing, and how do you know? A source helps."
                }
                className={`${FIELD} py-3 leading-6`}
              />
            </div>

            {/* Hidden from people; bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="sg-website">Website</label>
              <input id="sg-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className={`${LABEL} mb-2`}>Credit</legend>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
                <input type="radio" name="credit" checked={!credit} onChange={() => setCredit(false)} className="size-5 accent-amber" />
                Keep me anonymous
              </label>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
                <input type="radio" name="credit" checked={credit} onChange={() => setCredit(true)} className="size-5 accent-amber" />
                Credit me by name if you use this
              </label>
            </fieldset>

            {credit && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="sg-name" className={LABEL}>
                    Name (as shown)
                  </label>
                  <input id="sg-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={`${FIELD} h-11`} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="sg-email" className={LABEL}>
                    E-mail (never shown)
                  </label>
                  <input
                    id="sg-email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${FIELD} h-11`}
                  />
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="m-0 rounded-ctl border-2 border-gloed px-3.5 py-2.5 text-sm">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-creme-gedempt">Nothing is published before we have checked it.</span>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
