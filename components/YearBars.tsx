"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BAR_PITCH, FULL_WIDTH_FROM, MIN_YEARS, yearTicks } from "@/app/lib/publisherPage";

type YearBarsProps = {
  /** Titles per year, oldest first; years without titles may be left out. */
  counts: { year: number; count: number }[];
  /** The year jumped to, shown in Gloed. */
  selected: number | null;
  /** The period filtered on, shown in Gloed. */
  range: { from: number; to: number } | null;
  /** Link per year for a click (functions cannot be passed from the server). */
  yearHrefs: Record<number, string>;
  /** Link for a dragged period, with __FROM__ and __TO__ as placeholders. */
  rangeHref: string;
};

// Room for the bars inside the card: the page is at most 1248 px wide, a phone about 358 px,
// minus 20 px padding and a 1 px border on each side
const DESKTOP_ROOM = 1206;
const PHONE_ROOM = 316;

function plural(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "title" : "titles"}`;
}

/**
 * "Titles per publication year" (DESIGN.md "Jaarbalk", board Overzichten): one bar per year, overview
 * and navigation at once. A click jumps to a year; dragging over several bars filters on that period.
 * Bars are 20 px wide with 4 px between them and the card is as wide as they need (at least 480 px),
 * aligned left; from about 50 years it takes the full width and the bars get narrower. Under five
 * years there is no bar: the year headings in the list are enough.
 */
export default function YearBars({ counts, selected, range, yearHrefs, rangeHref }: YearBarsProps) {
  const router = useRouter();
  const row = useRef<HTMLDivElement>(null);
  const [drag, setDragState] = useState<{ start: number; end: number } | null>(null);
  // The same drag for the window listeners, which must not act inside a state update
  const dragRef = useRef<{ start: number; end: number } | null>(null);
  const setDrag = (d: { start: number; end: number } | null) => {
    dragRef.current = d;
    setDragState(d);
  };
  // Set when a drag ended on another year, so the click that follows does not jump
  const dragged = useRef(false);

  const first = counts[0]?.year ?? 0;
  const last = counts[counts.length - 1]?.year ?? 0;
  const span = last - first + 1;

  const yearAt = (clientX: number) => {
    const rect = row.current!.getBoundingClientRect();
    const i = Math.floor(((clientX - rect.left) / rect.width) * span);
    return first + Math.min(span - 1, Math.max(0, i));
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      const end = yearAt(e.clientX);
      if (d && d.end !== end) setDrag({ ...d, end });
    };
    const up = () => {
      const d = dragRef.current;
      setDrag(null);
      if (d && d.start !== d.end) {
        dragged.current = true;
        const lo = Math.min(d.start, d.end);
        const hi = Math.max(d.start, d.end);
        router.push(rangeHref.replace("__FROM__", String(lo)).replace("__TO__", String(hi)), { scroll: false });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // yearAt only depends on the bar row and the years, which do not change during a drag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, rangeHref, router]);

  if (counts.length === 0 || span < MIN_YEARS) return null;

  const full = span >= FULL_WIDTH_FROM;
  // Fixed bars: the bar row is exactly as wide as the bars and gaps
  const rowWidth = span * BAR_PITCH - (BAR_PITCH - 20);
  const desktopTicks = yearTicks(first, last, full ? DESKTOP_ROOM / span : BAR_PITCH);
  const phoneTicks = yearTicks(first, last, Math.min(full ? DESKTOP_ROOM / span : BAR_PITCH, PHONE_ROOM / span));
  const sameTicks = desktopTicks.join() === phoneTicks.join();

  const byYear = new Map(counts.map((c) => [c.year, c.count]));
  const most = Math.max(...counts.map((c) => c.count));
  // What is lit: the period being dragged, else the filtered period, else the year jumped to
  const lit = drag
    ? { from: Math.min(drag.start, drag.end), to: Math.max(drag.start, drag.end) }
    : range ?? (selected !== null ? { from: selected, to: selected } : null);
  const litCount = lit ? counts.filter((c) => c.year >= lit.from && c.year <= lit.to).reduce((n, c) => n + c.count, 0) : 0;

  // Middle of a bar as a fraction of the bar row
  const center = (i: number) => (full ? (i + 0.5) / span : (i * BAR_PITCH + 10) / rowWidth);
  const tickRow = (ticks: number[], className = "") => (
    <div className={`relative mt-1.5 h-[22px] font-mono text-xs text-creme-gedempt ${className}`} aria-hidden="true">
      {ticks.map((y) => (
        <span key={y} className="absolute top-0 -translate-x-1/2" style={{ left: `${center(y - first) * 100}%` }}>
          {y}
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-labelledby="per-year"
      className={`max-w-full self-start rounded-card border border-lijn bg-oppervlak px-5 pb-3.5 pt-[18px] ${
        full ? "w-full" : "min-w-[min(480px,100%)]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <h2 id="per-year" className="m-0 text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt">
          Titles per publication year
        </h2>
        {lit && (
          <span className="text-[13px] text-creme-gedempt" aria-live="polite">
            {drag ? "" : "Selected: "}
            {lit.from === lit.to ? lit.from : `${lit.from} to ${lit.to}`} · {plural(litCount)}
          </span>
        )}
      </div>
      <div className="max-w-full" style={full ? undefined : { width: rowWidth }}>
        <div
          ref={row}
          // Vertical scrolling keeps working on phones; a sideways drag selects a period
          className={`flex h-[90px] touch-pan-y select-none items-end ${full ? "gap-px sm:gap-[2px]" : "gap-1"}`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            dragged.current = false;
            const year = yearAt(e.clientX);
            setDrag({ start: year, end: year });
          }}
          onClickCapture={(e) => {
            if (dragged.current) {
              e.preventDefault();
              dragged.current = false;
            }
          }}
        >
          {Array.from({ length: span }, (_, i) => {
            const year = first + i;
            const count = byYear.get(year) ?? 0;
            // Fixed bars are 20 px and only shrink when a phone is too narrow; full-width bars share the room
            const size = full ? "min-w-0 flex-1" : "min-w-0 shrink basis-5";
            if (count === 0) return <span key={year} className={`h-full ${size}`} aria-hidden="true" />;
            const on = lit !== null && year >= lit.from && year <= lit.to;
            return (
              <Link
                key={year}
                href={yearHrefs[year]}
                aria-label={`${year}: ${plural(count)}`}
                aria-current={on ? "true" : undefined}
                title={`${year}: ${plural(count)}`}
                draggable={false}
                // The whole column is the tap target, not only the bar
                className={`group flex h-full items-end ${size}`}
              >
                <span
                  className={`block w-full rounded-t-[2px] ${on ? "bg-gloed" : "bg-amber group-hover:bg-gloed"}`}
                  style={{ height: `${Math.max(4, (count / most) * 100)}%` }}
                />
              </Link>
            );
          })}
        </div>
        {sameTicks ? (
          tickRow(desktopTicks)
        ) : (
          <>
            {tickRow(phoneTicks, "sm:hidden")}
            {tickRow(desktopTicks, "hidden sm:block")}
          </>
        )}
      </div>
    </section>
  );
}
