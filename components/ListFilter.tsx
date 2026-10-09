"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ListFilterProps = {
  /** Page the filter applies to, e.g. "/titles". */
  action: string;
  q: string | null;
  /** Choices to keep while filtering (sort, dir); the letter and page are dropped on purpose. */
  keep?: Record<string, string | null | undefined>;
  label?: string;
};

// Wait this long after the last key before updating the results
const DEBOUNCE_MS = 250;

function filterUrl(action: string, keep: ListFilterProps["keep"], q: string) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(keep ?? {})) if (value) params.set(name, value);
  if (q.trim()) params.set("q", q.trim());
  const qs = params.toString();
  return qs ? `${action}?${qs}` : action;
}

/**
 * "Filter this list": filters while you type (the URL is updated, the server renders the matches).
 * A filter always searches the whole list, so it leaves the A–Z letter and the page behind.
 * Without JavaScript it is a plain GET form.
 */
export default function ListFilter({ action, q, keep = {}, label = "Filter this list" }: ListFilterProps) {
  const router = useRouter();
  const [value, setValue] = useState(q ?? "");
  const [pending, startTransition] = useTransition();
  const lastSent = useRef(q ?? "");

  useEffect(() => {
    if (value.trim() === lastSent.current.trim()) return;
    const timer = setTimeout(() => {
      lastSent.current = value;
      startTransition(() => router.replace(filterUrl(action, keep, value), { scroll: false }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // keep is rebuilt on every render; its values are what matter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, action, router, JSON.stringify(keep)]);

  const clear = () => {
    setValue("");
    lastSent.current = "";
    startTransition(() => router.replace(filterUrl(action, keep, ""), { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <form
        action={action}
        method="get"
        role="search"
        className="flex w-full max-w-[400px] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          lastSent.current = value;
          startTransition(() => router.replace(filterUrl(action, keep, value), { scroll: false }));
        }}
      >
        {Object.entries(keep).map(([name, v]) => (v ? <input key={name} type="hidden" name={name} value={v} /> : null))}
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-ctl border border-lijn bg-oppervlak px-3.5 focus-within:border-amber">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="shrink-0 stroke-creme-gedempt"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className="sr-only">{label}</span>
          <input
            type="search"
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={label}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-creme placeholder:text-creme-gedempt focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {pending && (
            <span aria-live="polite" className="shrink-0 font-mono text-xs text-creme-gedempt">
              …
            </span>
          )}
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-ctl border border-creme px-4 text-sm font-semibold text-creme hover:bg-creme/10"
        >
          Filter
        </button>
      </form>
      {value && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-amber hover:underline sm:min-h-0"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
