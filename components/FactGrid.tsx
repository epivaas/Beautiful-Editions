import type { ReactNode } from "react";

export type FactItem = {
  label: string;
  value: ReactNode;
  /** Numbers, pages and years in IBM Plex Mono. */
  mono?: boolean;
};

function isEmpty(value: ReactNode) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/**
 * Facts grid (DESIGN.md §5): four columns (two on phones), a Lijn rule above each fact,
 * an 11 px field label and a 16/24 value. Empty values show a muted "—" (detail pages, DESIGN.md §1).
 */
export default function FactGrid({ items }: { items: FactItem[] }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-7 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-t border-lijn py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt">{item.label}</dt>
          <dd className={`m-0 mt-[3px] break-words text-base leading-6 ${item.mono ? "font-mono text-sm" : ""}`}>
            {isEmpty(item.value) ? <span className="text-leeg">—</span> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
