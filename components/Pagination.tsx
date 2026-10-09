import Link from "next/link";
import { getPageItems } from "@/app/lib/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Builds the link for a page, keeping the other query parameters. */
  hrefFor: (page: number) => string;
};

const BOX = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-ctl px-3 text-sm";

export default function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const idle = `${BOX} border border-lijn bg-oppervlak text-creme hover:bg-rij-hover`;
  const off = `${BOX} border border-lijn text-leeg`;

  const renderItems = (siblings: number) =>
    getPageItems(page, totalPages, siblings).map((item, i) =>
      item === "ellipsis" ? (
        <span key={`gap-${i}`} aria-hidden="true" className="px-1 font-mono text-sm text-creme-gedempt">
          …
        </span>
      ) : item === page ? (
        <span key={item} aria-current="page" className={`${BOX} bg-gloed font-mono font-medium text-inkt`}>
          {item}
        </span>
      ) : (
        <Link key={item} href={hrefFor(item)} aria-label={`Page ${item}`} className={`${idle} font-mono`}>
          {item}
        </Link>
      )
    );

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${idle} font-semibold`}>
          ←<span className="sr-only sm:not-sr-only"> Previous</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${off} font-semibold`}>←<span className="hidden sm:inline"> Previous</span></span>
      )}

      {/* Phone: only first, current and last page (1 … 7 … 20) so the row fits on one line */}
      <span className="contents sm:hidden">{renderItems(0)}</span>
      <span className="hidden sm:contents">{renderItems(1)}</span>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${idle} font-semibold`}>
          <span className="sr-only sm:not-sr-only">Next </span>→
        </Link>
      ) : (
        <span aria-hidden="true" className={`${off} font-semibold`}><span className="hidden sm:inline">Next </span>→</span>
      )}
    </nav>
  );
}
