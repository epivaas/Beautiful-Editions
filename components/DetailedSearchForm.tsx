"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import type { FacetField, FacetOption, SearchCriteria } from "@/app/lib/search";
import type { SearchOptions } from "@/app/lib/searchQueries";

type DetailedSearchFormProps = {
  criteria: SearchCriteria;
  /** All series with their publisher, to clear a series when another publisher is chosen. */
  series: SearchOptions["series"];
  /** Choices per list that still give results with the other criteria, with their counts. */
  facets: Record<FacetField, FacetOption[]>;
  /** Number of matching editions, or null when no criterion is set. */
  count: number | null;
  /** Quick search term to keep in the URL (the results above the form). */
  q: string | null;
};

type Values = Record<
  "title" | "author" | "publisher" | "series" | "illustrator" | "binding" | "from" | "to" | "language",
  string
> &
  Record<"limited" | "slipcase" | "photos", boolean>;

const TEXT_DEBOUNCE_MS = 300;
const SUGGEST_FIELDS = ["author", "illustrator", "binding"] as const;
type SuggestField = (typeof SUGGEST_FIELDS)[number];
type Suggestion = { value: string; count: number };

const LABEL = "text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt";
const FIELD =
  "h-11 w-full rounded-ctl border border-leeg bg-oppervlak px-3.5 text-[15px] text-creme placeholder:text-creme-gedempt focus:border-amber focus:outline-none";

function toValues(c: SearchCriteria): Values {
  return {
    title: c.title ?? "",
    author: c.author ?? "",
    publisher: c.publisher?.toString() ?? "",
    series: c.series?.toString() ?? "",
    illustrator: c.illustrator ?? "",
    binding: c.binding ?? "",
    from: c.from?.toString() ?? "",
    to: c.to?.toString() ?? "",
    language: c.language ?? "",
    limited: c.limited,
    slipcase: c.slipcase,
    photos: c.photos,
  };
}

function plural(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "edition" : "editions"}`;
}

function searchUrl(values: Values, q: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
    } else if (value.trim()) params.set(key, value.trim());
  }
  const qs = params.toString();
  return `/titles/search${qs ? `?${qs}` : ""}`;
}

/**
 * Detailed search (board Zoeken): every change updates the URL, the server counts and lists the
 * matching editions. Text fields wait until you stop typing; lists and check boxes apply at once.
 * Author, Illustrator and Binding suggest values while you type. Without JavaScript it is a GET form.
 */
export default function DetailedSearchForm({ criteria, series, facets, count, q }: DetailedSearchFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => toValues(criteria));
  const [suggestions, setSuggestions] = useState<Record<SuggestField, Suggestion[]>>({ author: [], illustrator: [], binding: [] });
  const [pending, startTransition] = useTransition();
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (textTimer.current) clearTimeout(textTimer.current);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    },
    []
  );

  const apply = (next: Values, delay: number) => {
    if (textTimer.current) clearTimeout(textTimer.current);
    const run = () => startTransition(() => router.replace(searchUrl(next, q), { scroll: false }));
    if (delay > 0) textTimer.current = setTimeout(run, delay);
    else run();
  };

  const set = <K extends keyof Values>(key: K, value: Values[K], delay = 0) => {
    const next = { ...values, [key]: value };
    // A series belongs to one publisher: a new publisher clears a series of another one
    if (key === "publisher" && next.series) {
      const chosen = series.find((s) => String(s.id) === next.series);
      if (chosen && String(chosen.publisherId) !== value) next.series = "";
    }
    setValues(next);
    apply(next, delay);
  };

  const fetchSuggestions = (field: SuggestField, text: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (text.trim().length < 2) return;
    // The other fields go along, so only values that still give results are suggested
    const others = new URL(searchUrl({ ...values, [field]: "" }, null), window.location.origin).searchParams;
    others.set("field", field);
    others.set("q", text.trim());
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?${others}`);
        if (res.ok) {
          const list = (await res.json()) as Suggestion[];
          setSuggestions((s) => ({ ...s, [field]: list }));
        }
      } catch {
        // Suggestions are a convenience; typing still works without them
      }
    }, 200);
  };

  const textField = (key: "title" | SuggestField, label: string, placeholder: string) => {
    const suggestible = (SUGGEST_FIELDS as readonly string[]).includes(key);
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`ds-${key}`} className={LABEL}>
          {label}
        </label>
        <input
          id={`ds-${key}`}
          name={key}
          type="text"
          value={values[key]}
          placeholder={placeholder}
          autoComplete="off"
          list={suggestible ? `ds-${key}-list` : undefined}
          onChange={(e) => {
            set(key, e.target.value, TEXT_DEBOUNCE_MS);
            if (suggestible) fetchSuggestions(key as SuggestField, e.target.value);
          }}
          className={FIELD}
        />
        {suggestible && (
          <datalist id={`ds-${key}-list`}>
            {suggestions[key as SuggestField].map((s) => (
              <option key={s.value} value={s.value}>
                {plural(s.count)}
              </option>
            ))}
          </datalist>
        )}
      </div>
    );
  };

  const selectField = (key: FacetField, label: string, any: string) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`ds-${key}`} className={LABEL}>
        {label}
      </label>
      <select id={`ds-${key}`} name={key} value={values[key]} onChange={(e) => set(key, e.target.value)} className={FIELD}>
        <option value="">{any}</option>
        {facets[key].map((item) => (
          <option key={item.value} value={item.value}>
            {item.label} ({item.count.toLocaleString("en-US")})
          </option>
        ))}
      </select>
    </div>
  );

  const yearField = (key: "from" | "to", label: string) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`ds-${key}`} className={LABEL}>
        {label}
      </label>
      <input
        id={`ds-${key}`}
        name={key}
        type="number"
        inputMode="numeric"
        min={1400}
        max={2100}
        value={values[key]}
        placeholder={key === "from" ? "Any year" : "Any year"}
        onChange={(e) => set(key, e.target.value, TEXT_DEBOUNCE_MS)}
        className={FIELD}
      />
    </div>
  );

  const checkbox = (key: "limited" | "slipcase" | "photos", label: string) => (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
      <input
        type="checkbox"
        name={key}
        value="1"
        checked={values[key]}
        onChange={(e) => set(key, e.target.checked)}
        className="size-5 cursor-pointer appearance-none rounded-[4px] border-2 border-creme bg-transparent checked:border-amber checked:bg-amber"
      />
      {label}
    </label>
  );

  return (
    <form
      action="/titles/search"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        apply(values, 0);
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="flex flex-col gap-6"
    >
      {q && <input type="hidden" name="q" value={q} />}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {textField("title", "Title", "Any title")}
        {textField("author", "Author", "Any author")}
        {selectField("publisher", "Publisher", "Any publisher")}
        {selectField("series", "Series", "Any series")}
        {textField("illustrator", "Illustrator", "Any illustrator")}
        {textField("binding", "Binding", "Any binding")}
        {yearField("from", "Year from")}
        {yearField("to", "Year to")}
        {selectField("language", "Language", "Any language")}
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
        {checkbox("limited", "Limited editions only")}
        {checkbox("slipcase", "With slipcase")}
        {checkbox("photos", "With photos")}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={count === 0}>
          {count === null ? "Show editions" : `Show ${count.toLocaleString("en-US")} ${count === 1 ? "edition" : "editions"}`}
        </Button>
        <button
          type="button"
          onClick={() => {
            const empty = toValues({
              title: null,
              author: null,
              publisher: null,
              series: null,
              illustrator: null,
              binding: null,
              from: null,
              to: null,
              language: null,
              limited: false,
              slipcase: false,
              photos: false,
            });
            setValues(empty);
            apply(empty, 0);
          }}
          className="inline-flex min-h-11 items-center text-[15px] font-semibold text-amber hover:underline"
        >
          Clear all
        </button>
        {pending && <span className="font-mono text-[13px] text-creme-gedempt">Updating…</span>}
      </div>
    </form>
  );
}
