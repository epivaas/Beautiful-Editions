import type { ReactNode } from "react";
import { Button } from "./Button";
import { VariantLabel } from "./Chip";

type SpotlightCardProps = {
  /** "Title in the spotlight" or "Publisher in the spotlight". */
  eyebrow: string;
  kind: "title" | "publisher";
  name: string;
  /** "by Miguel de Cervantes" (titles only). */
  byline?: string | null;
  /** Optional short text by Eric; hidden while there is none. */
  text?: string | null;
  /** Titles: "6 editions" as a Gloed label. Publishers: a mono line such as "38 titles · 57 editions". */
  count: ReactNode;
  href: string;
  cta: string;
};

/** First card of a spotlight row on the home page: an Amber outline, the name, a count and a button. */
export default function SpotlightCard({ eyebrow, kind, name, byline, text, count, href, cta }: SpotlightCardProps) {
  return (
    <article className="flex flex-col gap-2.5 rounded-card border border-amber bg-oppervlak p-[18px]">
      <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-amber">{eyebrow}</div>
      {kind === "title" ? (
        <h3 className="m-0 text-[28px] leading-[31px] tracking-[-0.025em]">{name}</h3>
      ) : (
        <h3 className="m-0">
          <span className="inline-flex min-h-[34px] items-center rounded-ctl bg-inkt px-3 text-[22px] font-extrabold tracking-[-0.02em] text-amber">
            {name}
          </span>
        </h3>
      )}
      {byline && <div className="text-sm text-creme-gedempt">{byline}</div>}
      {text && <p className="m-0 text-sm leading-[21px] text-creme-gedempt">{text}</p>}
      <div className="mt-auto flex flex-col items-start gap-2.5 pt-2">
        {kind === "title" ? <VariantLabel>{count}</VariantLabel> : <span className="font-mono text-sm text-creme-gedempt">{count}</span>}
        <Button href={href} className="text-sm">
          {cta}
        </Button>
      </div>
    </article>
  );
}
