import Link from "next/link";
import PhotoTile from "./PhotoTile";
import { IncludesChip, VariantLabel } from "./Chip";

type EditionCardProps = {
  href: string;
  title: string;
  publisher?: string | null;
  year?: number | string | null;
  binding?: string | null;
  illustrators?: string[];
  /** Slipcase, Clamshell box, Dust jacket... */
  includes?: string[];
  /** Variant labels, e.g. ["Lettered · 26", "Numbered · 250"]. */
  variants?: string[];
  /** Number of non-limited sub-editions (printings). */
  printings?: number;
  photo?: { src: string; alt?: string; credit?: string | null } | null;
};

/** Edition as a compact grid card. Empty fields are hidden, never shown as "—". */
export default function EditionCard({
  href,
  title,
  publisher,
  year,
  binding,
  illustrators = [],
  includes = [],
  variants = [],
  printings = 0,
  photo,
}: EditionCardProps) {
  const meta = [year, binding].filter((v) => v !== null && v !== undefined && v !== "").join(" · ");

  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-lijn bg-oppervlak transition-colors hover:border-amber">
      <PhotoTile src={photo?.src} alt={photo?.alt ?? title} credit={photo?.credit} className="h-[220px]" />
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3.5">
        {publisher && <div className="text-sm font-extrabold leading-[18px] text-amber">{publisher}</div>}
        <h3 className="m-0 text-xl leading-[25px] tracking-[-0.02em]">
          {/* Stretched link: the whole card is clickable, the © button stays on top */}
          <Link href={href} className="text-creme after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        {meta && <div className="font-mono text-[13px] text-creme-gedempt">{meta}</div>}
        {illustrators.length > 0 && (
          <div className="text-sm leading-[19px] text-creme-gedempt">{illustrators.join(", ")}</div>
        )}
        {includes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {includes.map((item) => (
              <IncludesChip key={item} size="sm">
                {item}
              </IncludesChip>
            ))}
          </div>
        )}
        {(variants.length > 0 || printings > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
            {variants.map((v) => (
              <VariantLabel key={v} size="sm">
                {v}
              </VariantLabel>
            ))}
            {printings > 0 && (
              <span className="font-mono text-[13px] text-creme-gedempt">
                {printings} {printings === 1 ? "printing" : "printings"}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
