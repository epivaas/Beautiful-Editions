import type { ReactNode } from "react";

const TITLE_SIZES = {
  xl: "text-5xl leading-[1] md:text-[88px] md:leading-[88px]",
  lg: "text-5xl leading-[1] md:text-[64px] md:leading-[64px]",
  md: "text-4xl leading-[1] md:text-5xl",
} as const;

type YellowBandProps = {
  title: ReactNode;
  size?: keyof typeof TITLE_SIZES;
  /** Publisher as an Inkt pill above the title. */
  publisher?: string | null;
  /** Second line, e.g. "Lettered edition". */
  subtitle?: ReactNode;
  /** Muted part of the subtitle, e.g. "2018"; shown after a middle dot. */
  subtitleNote?: ReactNode;
  /** Small line under the title: author, translator, illustrator. */
  meta?: ReactNode;
  /** Optional Gloed block on the right with a big number. */
  count?: { label: string; value: ReactNode; note?: ReactNode } | null;
  /** Heading level of the title; h1 on pages, h2 when shown as an example. */
  as?: "h1" | "h2";
  children?: ReactNode;
};

/** The yellow band at the top of title, edition, variant, author, series and publisher pages. */
export default function YellowBand({
  title,
  size = "xl",
  publisher,
  subtitle,
  subtitleNote,
  meta,
  count,
  as: Heading = "h1",
  children,
}: YellowBandProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-card bg-amber text-inkt md:flex-row md:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-6 md:px-9 md:pb-10 md:pt-9">
        {publisher && (
          <div>
            <span className="inline-flex min-h-9 items-center rounded-ctl bg-inkt px-3.5 text-xl font-extrabold tracking-[-0.01em] text-amber">
              {publisher}
            </span>
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

      {count && (
        <div className="flex flex-col justify-end gap-2.5 bg-gloed px-6 py-6 md:w-[280px] md:shrink-0 md:px-8 md:py-9">
          <div className="font-mono text-[15px] uppercase tracking-[0.08em]">{count.label}</div>
          <div className="text-[88px] font-extrabold leading-[0.8] tracking-[-0.04em] md:text-[130px]">
            {count.value}
          </div>
          {count.note && <div className="font-mono text-sm leading-[22px]">{count.note}</div>}
        </div>
      )}
    </section>
  );
}
