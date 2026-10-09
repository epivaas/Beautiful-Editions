import Link from "next/link";
import type { ReactNode } from "react";
import PhotoTile from "./PhotoTile";

type MosaicPhoto = { id: number; src: string; alt: string; credit: string | null };

type PhotoMosaicProps = {
  photos: MosaicPhoto[];
  /** The Photographs page: "View all N photos →" and the "+N" tile lead there. */
  allHref?: string;
  /** Muted line under the heading, e.g. "Photos of the edition". */
  note?: ReactNode;
};

const SMALL_SLOTS = 4;

function plural(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "photo" : "photos"}`;
}

/**
 * The strip on a page (board Fotos, step 1): a heading with the total and "View all", one large photo and
 * up to four small ones; with more photos the last slot is a "+N" tile for the rest. Each photo opens the
 * lightbox on that photo; the "+N" tile opens the Photographs page.
 */
export default function PhotoMosaic({ photos, allHref, note }: PhotoMosaicProps) {
  if (photos.length === 0) return null;

  const [large, ...rest] = photos;
  const overflow = photos.length > 1 + SMALL_SLOTS;
  const small = rest.slice(0, overflow ? SMALL_SLOTS - 1 : SMALL_SLOTS);
  const remaining = photos.length - 1 - small.length;

  const more = (
    <>
      <span className="sr-only">{remaining} more photos</span>
      <span aria-hidden="true" className="text-2xl font-extrabold tracking-[-0.02em] text-creme md:text-[32px]">
        +{remaining}
      </span>
      <span aria-hidden="true" className="hidden font-mono text-[13px] text-creme-gedempt md:block">
        more photos
      </span>
    </>
  );

  return (
    <section aria-labelledby="photographs" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-3">
          <h2 id="photographs" className="m-0 text-[28px] leading-[34px]">
            Photographs
          </h2>
          <span className="font-mono text-[13px] text-creme-gedempt">{photos.length.toLocaleString("en-US")}</span>
        </div>
        {allHref && (
          <Link href={allHref} className="inline-flex min-h-11 items-center text-sm font-bold text-amber hover:underline sm:min-h-0">
            View all {plural(photos.length)} →
          </Link>
        )}
      </div>
      {note && <p className="-mt-2 m-0 text-[13px] text-creme-gedempt">{note}</p>}

      <div className={`grid gap-3 ${small.length > 0 ? "md:grid-cols-[3fr_2fr]" : ""}`}>
        <PhotoTile src={large.src} alt={large.alt} credit={large.credit} padding={16} photoId={large.id} className="h-[280px] md:h-[360px]" />

        {small.length > 0 && (
          <div className="grid grid-cols-4 gap-3 md:grid-cols-2 md:grid-rows-2">
            {small.map((photo) => (
              <PhotoTile
                key={photo.id}
                src={photo.src}
                alt={photo.alt}
                credit={photo.credit}
                padding={8}
                photoId={photo.id}
                className="h-24 md:h-[174px]"
              />
            ))}
            {overflow &&
              (allHref ? (
                <Link href={allHref} className="flex h-24 flex-col items-center justify-center gap-1 bg-lijn hover:bg-rij-hover md:h-[174px]">
                  {more}
                </Link>
              ) : (
                <div className="flex h-24 flex-col items-center justify-center gap-1 bg-lijn md:h-[174px]">{more}</div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
