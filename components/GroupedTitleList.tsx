import Link from "next/link";
import type { GroupBy, ListItem } from "@/app/lib/publisherPage";
import { joinNames } from "@/app/lib/names";
import Highlight from "./Highlight";

type GroupedTitleListProps = {
  items: ListItem[];
  group: GroupBy;
  /** The year jumped to: its heading gets the Gloed edge (Group by Year only). */
  selected: number | null;
  /** Link that reverses the year order (Group by Year only), and the current order. */
  sortHref: string;
  dir: "asc" | "desc";
  q: string | null;
};

// Desktop columns from the board: Year | Title | Author | Illustrator | Editions
const COLS = "sm:grid sm:grid-cols-[88px_minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_80px] sm:gap-4";
// Headings stick under the site header (57 px on phones, 73 px from sm up)
const STICKY = "sticky top-[57px] z-10 sm:top-[73px]";

function plural(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "title" : "titles"}`;
}

/**
 * Titles of a publisher under sticky headings (board Overzichten): per year, per first letter of the
 * title or per author. Not a DataTable: sticky headings need the page to scroll, not a box. On phones
 * each row stacks author and illustrator under the title.
 */
export default function GroupedTitleList({ items, group, selected, sortHref, dir, q }: GroupedTitleListProps) {
  return (
    <div className="rounded-card border border-lijn bg-oppervlak">
      <div className={`${COLS} hidden rounded-t-card bg-kop px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt`}>
        {group === "year" ? (
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
        ) : (
          <span>Year</span>
        )}
        <span>Title</span>
        <span>Author</span>
        <span>Illustrator</span>
        <span className="text-right">Editions</span>
      </div>

      {items.map((item) =>
        item.kind === "group" ? (
          <div
            key={`${item.id}${item.continued ? "-c" : ""}`}
            id={item.continued ? undefined : item.id}
            className={`${STICKY} flex min-h-11 scroll-mt-[57px] items-center gap-4 border-t border-lijn px-5 sm:scroll-mt-[73px] ${
              item.year !== null && item.year === selected ? "border-l-4 border-l-gloed bg-rij-hover pl-4" : "bg-kop"
            }`}
          >
            <span className={`shrink-0 text-amber ${group === "author" ? "text-[15px] font-bold" : "w-[72px] font-mono text-sm font-medium"}`}>
              {item.label}
            </span>
            <span className="text-[13px] text-creme-gedempt">
              {plural(item.count)}
              {item.continued && " (continued)"}
            </span>
          </div>
        ) : (
          <div key={item.row.rowKey} className={`${COLS} flex items-center gap-3 border-t border-lijn px-5 py-2 hover:bg-rij-hover sm:min-h-11`}>
            {/* The year is in the heading when grouping by year */}
            <span className="hidden font-mono text-[13px] text-creme-gedempt sm:block">{group === "year" ? "" : item.row.year ?? "—"}</span>
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
              {/* Phones: year (when not in the heading), author and illustrator under the title */}
              <div className="text-[13px] text-creme-gedempt sm:hidden">
                {[
                  group !== "year" && item.row.year !== null ? String(item.row.year) : "",
                  joinNames(item.row.authors.map((a) => a.name)),
                  joinNames(item.row.illustrators),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
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
