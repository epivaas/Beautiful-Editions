"use client";

import { useId, useState } from "react";

type PhotoTileProps = {
  src?: string | null;
  alt: string;
  /** Source and rights, from photos.copyright_statement. The © button only appears when set. */
  credit?: string | null;
  /** Mat padding around the photo in px. */
  padding?: number;
  /** Size of the tile, e.g. "h-[190px]" or "h-[340px] w-[260px]". */
  className?: string;
};

/**
 * A photo on the grey mat: never cropped, never shown larger than its own size.
 * Plain <img> on purpose: next/image needs the dimensions up front, and we don't store them yet.
 */
export default function PhotoTile({ src, alt, credit, padding = 12, className = "" }: PhotoTileProps) {
  const [open, setOpen] = useState(false);
  const creditId = useId();

  return (
    <figure
      className={`group relative m-0 flex items-center justify-center overflow-hidden bg-mat ${className}`}
      style={{ padding }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="block h-auto max-h-full w-auto max-w-full object-contain"
        />
      ) : (
        <span className="text-[13px] font-semibold text-inkt">No photograph yet</span>
      )}

      {src && credit && (
        <>
          <figcaption
            id={creditId}
            className={`absolute inset-x-0 bottom-0 z-10 bg-inkt/90 px-3.5 py-3 pr-12 text-[13px] leading-[19px] text-creme transition-opacity ${
              open ? "opacity-100" : "pointer-events-none opacity-0 group-hover:opacity-100"
            }`}
          >
            {credit}
          </figcaption>
          {/* 44 px tap target around the visible 28 px circle */}
          <button
            type="button"
            aria-label="Photo credit"
            aria-expanded={open}
            aria-controls={creditId}
            onClick={() => setOpen((v) => !v)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            className="absolute bottom-0 right-0 z-10 flex size-11 items-center justify-center"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-inkt/85 text-sm font-semibold text-creme">
              ©
            </span>
          </button>
        </>
      )}
    </figure>
  );
}
