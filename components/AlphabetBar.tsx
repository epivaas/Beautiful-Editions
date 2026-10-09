import Link from "next/link";
import { LETTERS } from "@/app/lib/overview";

type AlphabetBarProps = {
  /** Active letter key ("A", "greek", "other"...), or null for all. */
  active: string | null;
  /** Number of rows per letter key; letters without rows are muted but stay in place. */
  counts: Map<string, number>;
  hrefFor: (letter: string | null) => string;
};

// 32 px boxes as on the boards, 44 px on phones; on phones the bar scrolls sideways
const BOX = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-ctl px-1.5 text-sm font-semibold sm:min-h-8 sm:min-w-8";

export default function AlphabetBar({ active, counts, hrefFor }: AlphabetBarProps) {
  return (
    <nav aria-label="A to Z" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex gap-0.5 sm:flex-wrap">
        <Link
          href={hrefFor(null)}
          aria-current={active === null ? "true" : undefined}
          className={`${BOX} mr-1.5 px-3 ${active === null ? "bg-amber text-inkt" : "text-creme hover:bg-oppervlak"}`}
        >
          All
        </Link>
        {LETTERS.map(({ key, label, name }) => {
          const n = counts.get(key) ?? 0;
          // Script groups (Α–Ω, А–Я) get a little more room than single letters
          const wide = label.length > 1 ? "px-2.5" : "";
          if (n === 0 && key !== active) {
            return (
              <span key={key} aria-disabled="true" className={`${BOX} ${wide} text-leeg`}>
                {label}
              </span>
            );
          }
          return (
            <Link
              key={key}
              href={hrefFor(key)}
              aria-current={key === active ? "true" : undefined}
              aria-label={`${name}, ${n}`}
              className={`${BOX} ${wide} ${key === active ? "bg-amber text-inkt" : "text-creme hover:bg-oppervlak"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
