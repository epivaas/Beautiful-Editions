import type { ReactNode } from "react";

type GloedBlockProps = {
  value?: ReactNode;
  label?: string;
  /** "above" on variant pages ("Edition of" 26), "below" elsewhere (14 "editions"). */
  labelPosition?: "above" | "below";
  /** Mono lines under the number (detail pages only). */
  lines?: ReactNode;
  /** Nothing to count: the block keeps its width and colour, without content (DESIGN.md §6). */
  empty?: boolean;
  /**
   * "default": detail pages (title, edition, author, variant), number 130 px with line height 0.8.
   * "compact": overview lists and the home page, number 80 px with line height 1 and only its label.
   */
  size?: "default" | "compact";
  /** Compact only: a 72 px number for wide values such as "3,000+" that do not fit 280 px at 80 px. */
  narrowNumber?: boolean;
};

const SIZES = {
  default: {
    box: "gap-2.5 px-6 py-6 md:px-8 md:py-9",
    value: "text-[88px] leading-[0.8] md:text-[130px]",
    label: "text-[15px]",
  },
  compact: {
    box: "gap-2 px-6 py-6 md:px-7 md:pb-[30px] md:pt-7",
    value: "text-[56px] leading-none md:text-[80px]",
    label: "text-[13px]",
  },
} as const;

/** The Gloed block on the right of a yellow band: one big number with its label. */
export default function GloedBlock({
  value,
  label,
  labelPosition = "below",
  lines,
  empty = false,
  size = "default",
  narrowNumber = false,
}: GloedBlockProps) {
  if (empty) return <div aria-hidden="true" className="min-h-12 bg-gloed md:w-[280px] md:shrink-0" />;

  const s = SIZES[size];
  return (
    <div className={`flex flex-col justify-end bg-gloed md:w-[280px] md:shrink-0 ${s.box}`}>
      <div className={`font-mono uppercase tracking-[0.08em] ${s.label} ${labelPosition === "below" ? "order-2" : ""}`}>
        {label}
      </div>
      <div
        className={`order-1 whitespace-nowrap font-extrabold tracking-[-0.04em] ${
          size === "compact" && narrowNumber ? "text-[56px] leading-none md:text-[72px]" : s.value
        }`}
      >
        {value}
      </div>
      {lines && size === "default" && <div className="order-3 font-mono text-sm leading-[22px]">{lines}</div>}
    </div>
  );
}
