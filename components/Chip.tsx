import Link from "next/link";
import type { ReactNode } from "react";

type FilterChipProps = {
  children: ReactNode;
  count?: number;
  selected?: boolean;
  /** No results for this filter: dashed and muted, but still visible so the row does not jump. */
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
};

/** Filter with an optional count. Selected is an Amber surface with Inkt text. */
export function FilterChip({ children, count, selected = false, disabled = false, href, onClick }: FilterChipProps) {
  const state = selected
    ? "border-amber bg-amber font-bold text-inkt"
    : disabled
      ? "border-dashed border-leeg bg-transparent font-medium text-leeg"
      : "border-lijn bg-oppervlak font-medium text-creme hover:bg-rij-hover";
  const classes = `inline-flex min-h-11 items-center gap-2 rounded-ctl border px-4 text-sm transition-colors ${state}`;
  const content = (
    <>
      {children}
      {count !== undefined && (
        <span className={`font-mono text-[13px] ${selected || disabled ? "" : "text-creme-gedempt"}`}>
          {count.toLocaleString("en-US")}
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} aria-current={selected ? "true" : undefined} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} className={classes}>
      {content}
    </button>
  );
}

type ActiveFilterProps = {
  children: ReactNode;
  /** Link that removes this filter. */
  removeHref: string;
};

/** An applied filter with a × to remove it. */
export function ActiveFilter({ children, removeHref }: ActiveFilterProps) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1 rounded-ctl bg-lijn pl-3 text-sm">
      {children}
      {/* 44 px tap target around the visible × */}
      <Link
        href={removeHref}
        aria-label={`Remove filter ${typeof children === "string" ? children : ""}`.trim()}
        className="-my-1.5 flex size-11 items-center justify-center text-base text-creme-gedempt hover:text-creme"
      >
        <span aria-hidden="true">×</span>
      </Link>
    </span>
  );
}

type LabelProps = {
  children: ReactNode;
  /** "sm" for compact grid cards: 24 px high, 12 px text. */
  size?: "md" | "sm";
};

const LABEL_SIZES = {
  md: "min-h-7 px-[11px] text-[13px]",
  sm: "min-h-6 px-2 text-xs",
} as const;

/** What comes with the book: slipcase, dust jacket, clamshell box... All equal, so one style. */
export function IncludesChip({ children, size = "md" }: LabelProps) {
  return (
    <span className={`inline-flex items-center rounded-ctl bg-lijn font-semibold text-creme ${LABEL_SIZES[size]}`}>
      {children}
    </span>
  );
}

/** Variant label such as "Lettered · 26" or "Edition of 26". Gloed surface, never Gloed text. */
export function VariantLabel({ children, size = "md" }: LabelProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-ctl bg-gloed font-bold text-inkt ${LABEL_SIZES[size]}`}
    >
      {children}
    </span>
  );
}
