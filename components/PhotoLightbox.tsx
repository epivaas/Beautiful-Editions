"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TitlePhoto } from "@/app/lib/titlePage";
import { neighbours } from "@/app/lib/photos";

// A horizontal move of at least this many px is a swipe
const SWIPE = 50;

/**
 * One photo large (board Fotos, step 3): a dark layer, the photo on the grey mat as large as fits but
 * never larger than the photo itself, arrows, ← → and Esc, swipe on phones, a strip of thumbnails, the
 * edition and the rights (copyright_statement). Each photo has its own address (?photo=id).
 */
export default function PhotoLightbox({ photos }: { photos: TitlePhoto[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = Number(params.get("photo"));
  const index = photos.findIndex((p) => p.id === id);
  const photo = index >= 0 ? photos[index] : null;

  const closeButton = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const swipeStart = useRef<number | null>(null);
  // Opened from this page (a link pushed ?photo=): closing goes back. Opened from a shared link: replace.
  const openedHere = useRef(false);
  const wasOpen = useRef(photo !== null);
  const [size, setSize] = useState<{ id: number; natural: [number, number]; shown: [number, number] } | null>(null);

  const hrefFor = useCallback(
    (photoId: number | null) => {
      const next = new URLSearchParams(params.toString());
      if (photoId === null) next.delete("photo");
      else next.set("photo", String(photoId));
      const qs = next.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [params, pathname]
  );

  const go = useCallback((photoId: number) => router.replace(hrefFor(photoId), { scroll: false }), [router, hrefFor]);
  const close = useCallback(() => {
    if (openedHere.current) router.back();
    else router.replace(hrefFor(null), { scroll: false });
  }, [router, hrefFor]);

  useEffect(() => {
    if (photo && !wasOpen.current) openedHere.current = true;
    if (!photo) openedHere.current = false;
    wasOpen.current = photo !== null;
  }, [photo]);

  // Keys, focus and no page scrolling while open
  useEffect(() => {
    if (!photo) return;
    const { previous, next } = neighbours(index, photos.length);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft" && photos.length > 1) go(photos[previous].id);
      else if (e.key === "ArrowRight" && photos.length > 1) go(photos[next].id);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [photo, index, photos, go, close]);

  useEffect(() => {
    if (photo) closeButton.current?.focus({ preventScroll: true });
  }, [photo !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the current thumbnail in view
  useEffect(() => {
    strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  if (!photo) return null;
  const { previous, next } = neighbours(index, photos.length);
  const measure = () => {
    const el = img.current;
    if (el && el.naturalWidth) setSize({ id: photo.id, natural: [el.naturalWidth, el.naturalHeight], shown: [el.clientWidth, el.clientHeight] });
  };
  // The size read from the photo on screen; until it has loaded, nothing
  const current = size?.id === photo.id ? size : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[100] flex flex-col bg-inkt text-creme"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <span className="font-mono text-sm text-creme-gedempt">
          {index + 1} / {photos.length}
        </span>
        <span className="hidden font-mono text-xs text-creme-gedempt sm:block">← → Esc</span>
        <button
          ref={closeButton}
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-full text-2xl text-creme hover:bg-creme/10"
        >
          ×
        </button>
      </div>

      {/* A click or tap next to the photo closes; a sideways swipe goes to the next or previous one */}
      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 sm:px-16"
        onClick={(e) => e.target === e.currentTarget && close()}
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (start === null || photos.length < 2) return;
          const dx = e.clientX - start;
          if (dx <= -SWIPE) go(photos[next].id);
          else if (dx >= SWIPE) go(photos[previous].id);
        }}
      >
        <div className="flex max-h-full max-w-full items-center justify-center bg-mat p-3 sm:p-4">
          {/* Plain <img>: as large as fits, never larger than the photo itself (no width or height set) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.id}
            ref={img}
            src={photo.src}
            alt={photo.alt}
            onLoad={measure}
            draggable={false}
            className="block h-auto max-h-[calc(100dvh-300px)] w-auto max-w-full select-none object-contain sm:max-h-[calc(100dvh-280px)]"
          />
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(photos[previous].id)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-oppervlak text-xl text-amber hover:bg-rij-hover sm:flex"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(photos[next].id)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-oppervlak text-xl text-amber hover:bg-rij-hover sm:flex"
            >
              →
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 pt-3 sm:px-6">
        {photos.length > 1 && (
          <div ref={strip} className="flex gap-2 overflow-x-auto pb-1" aria-label="All photos">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(p.id)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`flex h-14 shrink-0 items-center justify-center bg-mat p-1 ${i === index ? "outline outline-2 outline-amber" : "opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" loading="lazy" className="block h-full w-auto max-w-[80px] object-contain" />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-x-8 gap-y-2 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            {photo.place && (
              <Link href={photo.place.href} className="inline-flex min-h-11 items-center font-semibold text-amber hover:underline sm:min-h-0">
                {photo.place.label} · View edition →
              </Link>
            )}
            {current && (
              <p className="m-0 font-mono text-xs text-creme-gedempt">
                {current.shown[0] >= current.natural[0]
                  ? `Shown at its original size, ${current.natural[0]} × ${current.natural[1]} px.`
                  : `Original ${current.natural[0]} × ${current.natural[1]} px.`}
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-[13px] text-creme-gedempt sm:max-w-[45%] sm:text-right">
            {photo.credit && <span className="break-words">{photo.credit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
