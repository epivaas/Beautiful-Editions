import Link from "next/link";
import type { ReactNode } from "react";
import PhotoTile from "./PhotoTile";
import { Button } from "./Button";
import { IncludesChip, VariantLabel } from "./Chip";
import AlsoContains from "./AlsoContains";

type FeaturePhoto = { id: number; src: string; alt: string; credit: string | null };

type EditionFeatureCardProps = {
  href: string;
  title: string;
  publisher?: string | null;
  year?: number | null;
  binding?: string | null;
  pages?: string | null;
  illustrators?: string[];
  includes?: string[];
  variants?: string[];
  note?: string | null;
  photos?: FeaturePhoto[];
  /** "2 variants · 3 printings · 18 photos" */
  counts?: string;
  /** Other titles in this edition. */
  otherTitles?: { id: number; title: string }[];
};

const THUMBS = 3;
const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt";

function Fact({ label, mono = false, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-[90px]">
      <div className={FIELD_LABEL}>{label}</div>
      <div className={`mt-[3px] text-sm leading-5 ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}

function LabelledRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className={`w-[76px] shrink-0 ${FIELD_LABEL}`}>{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/** Edition as a full-width card (the "Cards" view on a title page). Empty fields and rows disappear. */
export default function EditionFeatureCard({
  href,
  title,
  publisher,
  year,
  binding,
  pages,
  illustrators = [],
  includes = [],
  variants = [],
  note,
  photos = [],
  counts,
  otherTitles = [],
}: EditionFeatureCardProps) {
  const [main, ...rest] = photos;
  const thumbs = rest.slice(0, THUMBS);
  const more = rest.length - thumbs.length;

  return (
    <article className="flex flex-wrap gap-7 rounded-card border border-lijn bg-oppervlak p-5">
      <div className="flex w-full flex-col gap-2 sm:w-[360px] sm:shrink-0">
        <PhotoTile src={main?.src} alt={main?.alt ?? title} credit={main?.credit} className="h-[260px]" />
        {thumbs.length > 0 && (
          <div className="flex gap-2">
            {/* Small thumbnails without ©: the credit is on the large photo and, later, in the viewer */}
            {thumbs.map((photo) => (
              <PhotoTile key={photo.id} src={photo.src} alt={photo.alt} padding={6} className="h-[78px] flex-1" />
            ))}
            {more > 0 && (
              <div className="flex h-[78px] flex-1 items-center justify-center bg-lijn font-mono text-sm font-medium">
                <span className="sr-only">{more} more photos</span>
                <span aria-hidden="true">+{more}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
        {publisher && <span className="text-lg font-extrabold leading-[22px] tracking-[-0.01em] text-amber">{publisher}</span>}
        <h3 className="m-0 text-[26px] leading-[30px] tracking-[-0.02em] sm:text-[30px] sm:leading-[34px]">
          <Link href={href} className="text-creme hover:text-amber">
            {title}
          </Link>
        </h3>
        <AlsoContains titles={otherTitles} max={3} />

        {(year || binding || pages || illustrators.length > 0) && (
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {year && <Fact label="Year" mono>{year}</Fact>}
            {binding && <Fact label="Binding">{binding}</Fact>}
            {pages && <Fact label="Pages" mono>{pages}</Fact>}
            {illustrators.length > 0 && (
              <Fact label={illustrators.length === 1 ? "Illustrator" : "Illustrators"}>{illustrators.join(", ")}</Fact>
            )}
          </div>
        )}

        {includes.length > 0 && (
          <LabelledRow label="Includes">
            {includes.map((item) => (
              <IncludesChip key={item}>{item}</IncludesChip>
            ))}
          </LabelledRow>
        )}

        {variants.length > 0 && (
          <LabelledRow label="Variants">
            {variants.map((v) => (
              <VariantLabel key={v}>{v}</VariantLabel>
            ))}
          </LabelledRow>
        )}

        {note && <p className="m-0 line-clamp-3 text-[15px] leading-[23px] text-creme-gedempt">{note}</p>}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          {counts ? <span className="font-mono text-[13px] text-creme-gedempt">{counts}</span> : <span />}
          <Button href={href}>View edition</Button>
        </div>
      </div>
    </article>
  );
}
