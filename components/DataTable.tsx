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
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  /** Accessible name of the table. */
  caption: string;
};

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}

/**
 * Table with a Kop header, alternating Oppervlak/Cocoa rows and "—" for empty fields.
 * Scrolls horizontally inside its own box on narrow screens, with the first column pinned.
 */
export default function DataTable<T>({ columns, rows, getRowKey, caption }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-card border border-lijn">
      <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
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
                className={`border-b border-lijn bg-kop px-[18px] py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt ${
                  col.align === "right" ? "text-right" : ""
                } ${i === 0 ? "sticky left-0 z-10" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const rowBg = r % 2 === 0 ? "bg-oppervlak" : "bg-cocoa";
            return (
              <tr key={getRowKey(row)} className={`group ${rowBg} hover:bg-rij-hover`}>
                {columns.map((col, i) => {
                  const value = col.render
                    ? col.render(row)
                    : (row as Record<string, ReactNode>)[col.key];
                  return (
                    <td
                      key={col.key}
                      className={`border-b border-lijn px-[18px] py-3 align-middle ${col.mono ? "whitespace-nowrap font-mono text-sm" : ""} ${
                        col.align === "right" ? "text-right" : ""
                      } ${i === 0 ? `sticky left-0 ${rowBg} group-hover:bg-rij-hover` : ""}`}
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
