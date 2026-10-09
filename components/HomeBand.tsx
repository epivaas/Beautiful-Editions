import Link from "next/link";
import GloedBlock from "./GloedBlock";

type HomeBandProps = {
  /** "3,000+" */
  editions: string;
};

/**
 * Compact yellow band of the home page (DESIGN.md §6 Startpagina, about 330 px): slogan, one sentence,
 * the big search and a compact Gloed block. The mark and word mark are only in the header.
 */
export default function HomeBand({ editions }: HomeBandProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-card bg-amber text-inkt md:flex-row md:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-3.5 p-6 md:px-9 md:pb-9 md:pt-8">
        <h1 className="m-0 max-w-[640px] text-[40px] leading-[1] tracking-[-0.04em] md:text-[60px] md:leading-[60px]">
          Find the edition worth owning
        </h1>
        <p className="m-0 max-w-[640px] text-lg font-medium leading-[26px]">
          A reference for beautifully illustrated editions: titles, editions, limited editions, printings and photographs, with
          sources.
        </p>

        <form action="/titles/search" method="get" role="search" className="mt-1.5 flex flex-wrap items-center gap-3">
          <label className="flex h-14 min-w-0 flex-[1_1_260px] items-center gap-3 rounded-card bg-creme px-[18px] md:max-w-[620px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="shrink-0 stroke-lijn"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <span className="sr-only">Search titles, authors, publishers</span>
            <input
              type="search"
              name="q"
              placeholder="Search titles, authors, publishers"
              className="min-w-0 flex-1 bg-transparent text-[17px] text-inkt placeholder:text-lijn focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-14 items-center rounded-card bg-inkt px-6 text-base font-bold text-amber hover:bg-inkt/90"
          >
            Search
          </button>
          <Link
            href="/titles/search"
            className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-bold underline underline-offset-[3px] hover:no-underline"
          >
            Detailed search →
          </Link>
        </form>
      </div>

      <GloedBlock size="compact" narrowNumber value={editions} label="editions" />
    </section>
  );
}
