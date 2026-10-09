import Link from "next/link";
import { BAR_PITCH, FULL_WIDTH_FROM, MIN_YEARS, yearTicks } from "@/app/lib/publisherPage";

type YearBarsProps = {
  /** Titles per year, oldest first; years without titles may be left out. */
  counts: { year: number; count: number }[];
  selected: number | null;
  hrefFor: (year: number) => string;
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
 * and navigation at once. Bars are 20 px wide with 4 px between them and the card is as wide as they
 * need (at least 480 px), aligned left; from about 50 years it takes the full width and the bars get
 * narrower. Under five years there is no bar: the year headings in the list are enough.
 */
export default function YearBars({ counts, selected, hrefFor }: YearBarsProps) {
  if (counts.length === 0) return null;
  const first = counts[0].year;
  const last = counts[counts.length - 1].year;
  const span = last - first + 1;
  if (span < MIN_YEARS) return null;

  const full = span >= FULL_WIDTH_FROM;
  // Fixed bars: the bar row is exactly as wide as the bars and gaps
  const rowWidth = span * BAR_PITCH - (BAR_PITCH - 20);
  const desktopTicks = yearTicks(first, last, full ? DESKTOP_ROOM / span : BAR_PITCH);
  const phoneTicks = yearTicks(first, last, Math.min(full ? DESKTOP_ROOM / span : BAR_PITCH, PHONE_ROOM / span));
  const sameTicks = desktopTicks.join() === phoneTicks.join();

  const byYear = new Map(counts.map((c) => [c.year, c.count]));
  const most = Math.max(...counts.map((c) => c.count));
  const selectedCount = selected !== null ? byYear.get(selected) : undefined;

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
        {selected !== null && selectedCount !== undefined && (
          <span className="text-[13px] text-creme-gedempt">
            Selected: {selected} · {plural(selectedCount)}
          </span>
        )}
      </div>
      <div className="max-w-full" style={full ? undefined : { width: rowWidth }}>
        <div className={`flex h-[90px] items-end ${full ? "gap-px sm:gap-[2px]" : "gap-1"}`}>
          {Array.from({ length: span }, (_, i) => {
            const year = first + i;
            const count = byYear.get(year) ?? 0;
            // Fixed bars are 20 px and only shrink when a phone is too narrow; full-width bars share the room
            const size = full ? "min-w-0 flex-1" : "min-w-0 shrink basis-5";
            if (count === 0) return <span key={year} className={`h-full ${size}`} aria-hidden="true" />;
            return (
              <Link
                key={year}
                href={hrefFor(year)}
                aria-label={`${year}: ${plural(count)}`}
                aria-current={year === selected ? "true" : undefined}
                title={`${year}: ${plural(count)}`}
                // The whole column is the tap target, not only the bar
                className={`group flex h-full items-end ${size}`}
              >
                <span
                  className={`block w-full rounded-t-[2px] ${year === selected ? "bg-gloed" : "bg-amber group-hover:bg-gloed"}`}
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
