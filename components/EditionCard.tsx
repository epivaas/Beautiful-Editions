import Link from "next/link";
import PhotoTile from "./PhotoTile";
import { VariantLabel } from "./Chip";

type EditionCardProps = {
  href: string;
  title: string;
  publisher?: string | null;
  year?: number | string | null;
  binding?: string | null;
  /** Variant labels, e.g. ["Lettered 26", "Numbered 250"]. */
  variants?: string[];
  photo?: { src: string; alt?: string; credit?: string | null } | null;
};

/** Edition as a card. Empty fields are hidden, never shown as "—". */
export default function EditionCard({ href, title, publisher, year, binding, variants = [], photo }: EditionCardProps) {
  const meta = [year, binding].filter((v) => v !== null && v !== undefined && v !== "").join(" · ");

  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-lijn bg-oppervlak transition-colors hover:border-amber">
      <PhotoTile src={photo?.src} alt={photo?.alt ?? title} credit={photo?.credit} className="h-[190px]" />
      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3.5">
        <h3 className="m-0 text-[19px] leading-[23px] tracking-[-0.015em]">
          {/* Stretched link: the whole card is clickable, the © button stays on top */}
          <Link href={href} className="text-creme after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        {publisher && <div className="text-sm font-bold text-amber">{publisher}</div>}
        {meta && <div className="font-mono text-[13px] text-creme-gedempt">{meta}</div>}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {variants.map((v) => (
              <VariantLabel key={v}>{v}</VariantLabel>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
