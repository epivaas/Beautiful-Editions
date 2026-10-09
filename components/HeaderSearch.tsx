"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Highlight from "./Highlight";
import { joinNames } from "@/app/lib/names";
import { QUICK_MIN_LENGTH, type QuickResults } from "@/app/lib/search";

type HeaderSearchProps = {
  className?: string;
  autoFocus?: boolean;
};

type Option = { key: string; href: string; group: "Authors" | "Titles" | "Publishers" };

const DEBOUNCE_MS = 150;
const GROUP_LABEL = "px-[18px] pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt";

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Search field in the header with live results (DESIGN.md §5, board Zoeken): from the second character,
 * grouped by kind, typed characters marked in Gloed. ↑ ↓ choose a row, Enter opens it (or all results), Esc closes.
 */
export default function HeaderSearch({ className = "", autoFocus = false }: HeaderSearchProps) {
  const router = useRouter();
  const listId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickResults | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typing = query.length > 0;
  const searching = query.trim().length >= QUICK_MIN_LENGTH;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (!res.ok) return;
        setResults((await res.json()) as QuickResults);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted by the next key press, or offline: keep the previous results
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searching]);

  // Rows in the order they appear: Authors, Titles, Publishers (board Zoeken)
  const options: Option[] = useMemo(
    () =>
      results
        ? [
            ...results.authors.items.map((a) => ({ key: `a${a.id}`, href: `/author/${a.id}`, group: "Authors" as const })),
            ...results.titles.items.map((t) => ({ key: `t${t.id}`, href: `/titles/${t.id}`, group: "Titles" as const })),
            ...results.publishers.items.map((p) => ({
              key: `p${p.id}`,
              href: `/publishers-series/${p.id}`,
              group: "Publishers" as const,
            })),
          ]
        : [],
    [results]
  );
  const showPanel = open && searching && results !== null;
  const allResults = `/titles/search?q=${encodeURIComponent(query.trim())}`;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!showPanel || options.length === 0) return;
      e.preventDefault();
      // -1 is "no row chosen" (Enter then opens all results); the arrows cycle through it
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => {
        const next = i + step;
        if (next >= options.length) return -1;
        if (next < -1) return options.length - 1;
        return next;
      });
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showPanel && active >= 0 && options[active]) go(options[active].href);
    else if (query.trim()) go(allResults);
  };

  const optionProps = (key: string) => {
    const index = options.findIndex((o) => o.key === key);
    return {
      id: `${listId}-${key}`,
      role: "option" as const,
      "aria-selected": index === active,
      className: `flex items-center justify-between gap-4 px-[18px] py-2 ${index === active ? "bg-rij-hover" : "hover:bg-rij-hover"}`,
      onMouseEnter: () => setActive(index),
    };
  };

  return (
    <div
      ref={wrapper}
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <form
        role="search"
        onSubmit={onSubmit}
        className={`flex h-11 w-full items-center gap-2.5 rounded-ctl px-3 text-sm transition-colors ${
          typing ? "border-2 border-amber bg-oppervlak" : "border border-lijn bg-cocoa"
        } focus-within:border-amber`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className={`shrink-0 ${typing ? "stroke-creme" : "stroke-creme-gedempt"}`}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search"
          aria-label="Search titles, authors and publishers"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 && options[active] ? `${listId}-${options[active].key}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 self-stretch bg-transparent text-creme placeholder:text-creme-gedempt focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <Link
          href="/titles/search"
          className="-mr-3 flex min-h-11 shrink-0 items-center px-3 text-xs font-semibold text-amber hover:underline"
        >
          Detailed
        </Link>
      </form>

      {showPanel && results && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute right-0 top-full z-50 mt-2 w-[min(540px,calc(100vw-2rem))] overflow-hidden rounded-card border border-lijn bg-oppervlak py-2"
        >
          <div className={GROUP_LABEL}>Authors</div>
          {results.authors.items.length === 0 && <div className="px-[18px] py-2 text-[15px] text-creme-gedempt">No matches</div>}
          {results.authors.items.map((a) => (
            <Link key={a.id} href={`/author/${a.id}`} tabIndex={-1} onClick={() => setOpen(false)} {...optionProps(`a${a.id}`)}>
              <span className="min-w-0 text-base font-bold">
                <Highlight text={a.name} q={query} />
              </span>
              <span className="shrink-0 font-mono text-[13px] text-creme-gedempt">{plural(a.titles, "title")}</span>
            </Link>
          ))}

          <div className={GROUP_LABEL}>Titles</div>
          {results.titles.items.length === 0 && <div className="px-[18px] py-2 text-[15px] text-creme-gedempt">No matches</div>}
          {results.titles.items.map((t) => (
            <Link key={t.id} href={`/titles/${t.id}`} tabIndex={-1} onClick={() => setOpen(false)} {...optionProps(`t${t.id}`)}>
              <span className="min-w-0 text-[15px]">
                <Highlight text={t.title} q={query} />
                {(t.englishTitle || t.authors.length > 0) && (
                  <span className="text-creme-gedempt">
                    {" · "}
                    {t.englishTitle && (
                      <>
                        <Highlight text={t.englishTitle} q={query} />
                        {t.authors.length > 0 && ", "}
                      </>
                    )}
                    {t.authors.length > 0 && <Highlight text={joinNames(t.authors)} q={query} />}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-[13px] text-creme-gedempt">{plural(t.editions, "edition")}</span>
            </Link>
          ))}

          <div className={GROUP_LABEL}>Publishers</div>
          {results.publishers.items.length === 0 && <div className="px-[18px] py-2 text-[15px] text-creme-gedempt">No matches</div>}
          {results.publishers.items.map((p) => (
            <Link
              key={p.id}
              href={`/publishers-series/${p.id}`}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              {...optionProps(`p${p.id}`)}
            >
              <span className="min-w-0 text-[15px]">
                <Highlight text={p.name} q={query} />
              </span>
              <span className="shrink-0 font-mono text-[13px] text-creme-gedempt">{plural(p.editions, "edition")}</span>
            </Link>
          ))}

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-lijn px-[18px] pt-3 text-sm">
            <span className="text-creme-gedempt">
              {results.total > 0 ? `Press Enter for all ${results.total.toLocaleString("en-US")} results` : "No results"}
            </span>
            <Link href="/titles/search" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center font-bold text-amber hover:underline sm:min-h-0">
              Detailed search →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
