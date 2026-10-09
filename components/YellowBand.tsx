import type { ReactNode } from "react";

const TITLE_SIZES = {
  xl: "text-5xl leading-[1] md:text-[88px] md:leading-[88px]",
  lg: "text-5xl leading-[1] md:text-[64px] md:leading-[64px]",
  md: "text-4xl leading-[1] md:text-5xl",
  /** Overview lists (Titles, Authors...): 72 px in a compact band. */
  list: "text-5xl leading-[1] md:text-[72px] md:leading-[72px]",
} as const;

type YellowBandProps = {
  title: ReactNode;
  size?: keyof typeof TITLE_SIZES;
  /** Publisher as an Inkt pill above the title. */
  publisher?: string | null;
  /** Line above the title, e.g. the English title on a title page (28/34, 600). */
  above?: ReactNode;
  /** Second line, e.g. "Lettered edition". */
  subtitle?: ReactNode;
  /** Muted part of the subtitle, e.g. "2018"; shown after a middle dot. */
  subtitleNote?: ReactNode;
  /** Small line under the title: author, translator, illustrator. */
  meta?: ReactNode;
  /**
   * Gloed block on the right with a big number. "empty" keeps the block (same width and colour) without
   * content when there is nothing to count: on detail pages it never disappears (DESIGN.md §6).
   * labelPosition: "above" on variant pages ("Edition of" 26), "below" on title pages (14 "editions").
   */
  count?: { label: string; value: ReactNode; note?: ReactNode; labelPosition?: "above" | "below" } | "empty" | null;
  /** Heading level of the title; h1 on pages, h2 when shown as an example. */
  as?: "h1" | "h2";
  /** Compact band for overview lists (about 180 px high): less padding and a smaller number (80 px). */
  compact?: boolean;
  children?: ReactNode;
};

/** The yellow band at the top of title, edition, variant, author, series and publisher pages. */
export default function YellowBand({
  title,
  size = "xl",
  publisher,
  above,
  subtitle,
  subtitleNote,
  meta,
  count,
  as: Heading = "h1",
  compact = false,
  children,
}: YellowBandProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-card bg-amber text-inkt md:flex-row md:items-stretch">
      <div
        className={`flex min-w-0 flex-1 flex-col p-6 md:px-9 ${compact ? "justify-center gap-2.5 md:py-9" : "gap-3.5 md:pb-10 md:pt-9"}`}
      >
        {publisher && (
          <div>
            <span className="inline-flex min-h-9 items-center rounded-ctl bg-inkt px-3.5 text-xl font-extrabold tracking-[-0.01em] text-amber">
              {publisher}
            </span>
          </div>
        )}
        {above && (
          <div className="text-[22px] font-semibold leading-7 tracking-[-0.01em] md:text-[28px] md:leading-[34px]">
            {above}
          </div>
        )}
        <Heading className={`m-0 font-extrabold tracking-[-0.04em] ${TITLE_SIZES[size]}`}>{title}</Heading>
        {subtitle && (
          <div className="text-2xl font-extrabold leading-tight tracking-[-0.02em] md:text-[34px] md:leading-10">
            {subtitle}
            {subtitleNote && <span className="font-medium"> · {subtitleNote}</span>}
          </div>
        )}
        {meta && <div className="text-base leading-6">{meta}</div>}
        {children}
      </div>

      {count === "empty" && (
        <div aria-hidden="true" className="min-h-12 bg-gloed md:w-[280px] md:shrink-0" />
      )}

      {count && count !== "empty" && (
        <div
          className={`flex flex-col justify-end gap-2.5 bg-gloed px-6 py-6 md:w-[280px] md:shrink-0 md:px-8 md:py-9`}
        >
          <div
            className={`font-mono text-[15px] uppercase tracking-[0.08em] ${count.labelPosition === "below" ? "order-2" : ""}`}
          >
            {count.label}
          </div>
          <div
            className={`order-1 font-extrabold leading-[0.8] tracking-[-0.04em] ${compact ? "text-[56px] md:text-[80px]" : "text-[88px] md:text-[130px]"}`}
          >
            {count.value}
          </div>
          {count.note && <div className="order-3 font-mono text-sm leading-[22px]">{count.note}</div>}
        </div>
      )}
    </section>
  );
}
