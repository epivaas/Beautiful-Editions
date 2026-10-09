import Link from "next/link";
import type { ListItem } from "@/app/lib/publisherPage";
import { joinNames } from "@/app/lib/names";
import Highlight from "./Highlight";

type YearGroupedListProps = {
  items: ListItem[];
  selected: number | null;
  /** Link that reverses the year order, and the current order. */
  sortHref: string;
  dir: "asc" | "desc";
  q: string | null;
};

// Desktop columns from the board: Year | Title | Author | Illustrator | Editions
const COLS = "sm:grid sm:grid-cols-[88px_minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_80px] sm:gap-4";
// Year headings stick under the site header (57 px on phones, 73 px from sm up)
const STICKY = "sticky top-[57px] z-10 sm:top-[73px]";

function plural(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "title" : "titles"}`;
}

/**
 * Titles of a publisher grouped per year (board Overzichten). Not a DataTable: sticky year headings
 * need the page to scroll, not a box. On phones each row stacks author and illustrator under the title.
 */
export default function YearGroupedList({ items, selected, sortHref, dir, q }: YearGroupedListProps) {
  return (
    <div className="rounded-card border border-lijn bg-oppervlak">
      <div className={`${COLS} hidden rounded-t-card bg-kop px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt`}>
        <Link
          href={sortHref}
          className="text-creme-gedempt hover:text-creme"
          aria-label={`Year, ${dir === "desc" ? "newest" : "oldest"} first; reverse the order`}
        >
          Year{" "}
          <span aria-hidden="true" className="text-amber">
            {dir === "desc" ? "▼" : "▲"}
          </span>
        </Link>
        <span>Title</span>
        <span>Author</span>
        <span>Illustrator</span>
        <span className="text-right">Editions</span>
      </div>

      {items.map((item) =>
        item.kind === "year" ? (
          <div
            key={`y-${item.year ?? "unknown"}${item.continued ? "-c" : ""}`}
            id={item.continued ? undefined : `y-${item.year ?? "unknown"}`}
            className={`${STICKY} flex min-h-11 scroll-mt-[57px] items-center gap-4 border-t border-lijn px-5 sm:scroll-mt-[73px] ${
              item.year !== null && item.year === selected ? "border-l-4 border-l-gloed bg-rij-hover pl-4" : "bg-kop"
            }`}
          >
            <span className="w-[72px] shrink-0 font-mono text-sm font-medium text-amber">{item.year ?? "Unknown year"}</span>
            <span className="text-[13px] text-creme-gedempt">
              {plural(item.count)}
              {item.continued && " (continued)"}
            </span>
          </div>
        ) : (
          <div key={item.row.key} className={`${COLS} flex items-center gap-3 border-t border-lijn px-5 py-2 hover:bg-rij-hover sm:min-h-11`}>
            <span className="hidden sm:block" />
            <div className="min-w-0 flex-1">
              <Link
                href={item.row.editionId ? `/edition/${item.row.editionId}?from=${item.row.workId}` : `/titles/${item.row.workId}`}
                className="inline-flex min-h-11 items-center text-[15px] font-bold text-creme decoration-amber decoration-2 underline-offset-4 hover:underline sm:min-h-0"
              >
                <span>
                  <Highlight text={item.row.title} q={q} />
                </span>
              </Link>
              {item.row.englishTitle && (
                <div className="text-[13px] text-creme-gedempt">
                  <Highlight text={item.row.englishTitle} q={q} />
                </div>
              )}
              {/* Phones: author and illustrator under the title */}
              {(item.row.authors.length > 0 || item.row.illustrators.length > 0) && (
                <div className="text-[13px] text-creme-gedempt sm:hidden">
                  {[joinNames(item.row.authors.map((a) => a.name)), joinNames(item.row.illustrators)].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div className="hidden min-w-0 text-sm sm:block">
              {item.row.authors.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && "; "}
                  <Link href={`/author/${a.id}`} className="text-amber hover:underline">
                    <Highlight text={a.name} q={q} />
                  </Link>
                </span>
              ))}
            </div>
            <div className="hidden min-w-0 text-sm text-creme-gedempt sm:block">
              <Highlight text={joinNames(item.row.illustrators)} q={q} />
            </div>
            <span className="shrink-0 text-right font-mono text-[13px]">
              <span className="sr-only">Editions: </span>
              {item.row.editions}
            </span>
          </div>
        )
      )}
    </div>
  );
}
