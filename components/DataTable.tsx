import Link from "next/link";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  /** Column width as a CSS value, e.g. "40%" or "110px". */
  width?: string;
  align?: "left" | "right";
  /** Numbers, years and counts in IBM Plex Mono. */
  mono?: boolean;
  /** Custom cell; defaults to row[key]. Return null/undefined/"" for an empty cell. */
  render?: (row: T) => ReactNode;
  /** Makes the header a sort link (see the `sort` prop of the table). */
  sortKey?: string;
};

/** Links inside table cells: a 44 px tap target on phones, normal size from sm up. */
export const CELL_LINK = "inline-flex min-h-11 items-center sm:min-h-0";

/** The title link of a row: Crème, with a 2 px Amber underline while the row is hovered (DESIGN.md §5). */
export const ROW_TITLE =
  "text-creme decoration-amber decoration-2 underline-offset-4 group-hover:underline focus-visible:underline";

export type TableSort = {
  key: string;
  dir: "asc" | "desc";
  /** Link for sorting on a key; the table passes the direction the click should give. */
  hrefFor: (key: string, dir: "asc" | "desc") => string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  /** Accessible name of the table. */
  caption: string;
  /** Sortable headers: clicking the active one reverses it, another one starts ascending. */
  sort?: TableSort;
};

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}

/**
 * Table with a Kop header, Oppervlak rows with a hairline between them (no zebra) and "—" for empty fields.
 * Fixed column widths keep every page of a list the same. Scrolls horizontally inside its own box on
 * narrow screens, with the first column pinned.
 */
export default function DataTable<T>({ columns, rows, getRowKey, caption, sort }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-card border border-lijn">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-[15px] [&_tbody_tr:last-child_td]:border-b-0">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  sort && col.sortKey === sort.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                }
                className={`border-b border-lijn bg-kop px-[18px] py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt ${
                  col.align === "right" ? "text-right" : ""
                } ${i === 0 ? "sticky left-0 z-10" : ""}`}
              >
                {sort && col.sortKey ? (
                  <Link
                    href={sort.hrefFor(
                      col.sortKey,
                      col.sortKey === sort.key && sort.dir === "asc" ? "desc" : "asc"
                    )}
                    scroll={false}
                    className="inline-flex min-h-11 items-center gap-1 hover:text-creme sm:min-h-0"
                  >
                    {col.label}
                    {col.sortKey === sort.key && (
                      <span aria-hidden="true" className="text-amber">
                        {sort.dir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </Link>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr key={getRowKey(row)} className="group bg-oppervlak hover:bg-rij-hover">
                {columns.map((col, i) => {
                  const value = col.render
                    ? col.render(row)
                    : (row as Record<string, ReactNode>)[col.key];
                  return (
                    <td
                      key={col.key}
                      className={`break-words border-b border-lijn px-[18px] py-3 align-middle ${col.mono ? "font-mono text-sm" : ""} ${
                        col.align === "right" ? "text-right" : ""
                      } ${i === 0 ? "sticky left-0 bg-oppervlak group-hover:bg-rij-hover" : ""}`}
                    >
                      {isEmpty(value) ? <span className="text-leeg">—</span> : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
