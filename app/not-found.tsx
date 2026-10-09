import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";

export const metadata: Metadata = { title: "Not found · Shelfhound" };

const OVERVIEWS = [
  { href: "/titles", label: "Titles" },
  { href: "/author", label: "Authors" },
  { href: "/publishers", label: "Publishers" },
  { href: "/series", label: "Series" },
];

/**
 * 404 (board About en randgevallen): the band of every page with the mark in Inkt on the Gloed block,
 * a search field in the page itself and links to the overviews.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col overflow-hidden rounded-card bg-amber text-inkt md:flex-row md:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3.5 p-6 md:px-9 md:py-10">
          <div className="font-mono text-[13px] uppercase tracking-[0.08em]">Error 404</div>
          <h1 className="m-0 text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] md:text-[64px] md:leading-[66px]">
            This book is not on the shelf
          </h1>
          <p className="m-0 max-w-[620px] text-lg leading-7 md:text-xl md:leading-[30px]">
            This page does not exist or has moved. Search below or go to an overview.
          </p>
        </div>
        <div className="flex items-center justify-center gap-6 bg-gloed p-6 md:w-[340px] md:flex-col md:gap-4 md:p-8">
          <div className="text-[80px] font-extrabold leading-[0.8] tracking-[-0.04em] md:text-[150px]" aria-hidden="true">
            404
          </div>
          <Logo variant="ink" size={88} className="size-16 md:size-[88px]" />
        </div>
      </section>

      <form action="/titles/search" method="get" role="search" className="flex max-w-[640px] flex-wrap gap-3">
        <label htmlFor="nf-search" className="sr-only">
          Search titles, authors, publishers
        </label>
        <input
          id="nf-search"
          name="q"
          type="search"
          placeholder="Search titles, authors, publishers"
          className="h-11 min-w-0 flex-1 basis-60 rounded-ctl border border-leeg bg-oppervlak px-3.5 text-[15px] text-creme placeholder:text-creme-gedempt focus:border-amber focus:outline-none"
        />
        <Button type="submit">Search</Button>
      </form>

      <nav aria-label="Overviews" className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.09em] text-creme-gedempt">Or go to</span>
        <div className="flex flex-wrap gap-3">
          {OVERVIEWS.map((o) => (
            <Button key={o.href} href={o.href} variant="secondary">
              {o.label}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
