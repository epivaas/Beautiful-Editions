"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Covers a photo tile and opens it in the lightbox (?photo=id), keeping the page's other parameters. */
export default function PhotoOpenLink({ photoId, label }: { photoId: number; label: string }) {
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams().toString());
  params.set("photo", String(photoId));
  return (
    <Link
      href={`${pathname}?${params.toString()}`}
      scroll={false}
      aria-label={label}
      className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-amber"
    />
  );
}
