import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTitlePage } from "@/app/lib/titlePageQuery";
import {
  collectPhotos,
  filterByPublisher,
  publisherCounts,
  sortEditions,
  summarize,
  toEditionRow,
  countLine,
  sortRows,
  type SortDir,
  type SortKey,
} from "@/app/lib/titlePage";
import YellowBand from "@/components/YellowBand";
import PhotoMosaic from "@/components/PhotoMosaic";
import EditionCard from "@/components/EditionCard";
import EditionFeatureCard from "@/components/EditionFeatureCard";
import ViewToggle from "@/components/ViewToggle";
import { FilterChip } from "@/components/Chip";
import { Button, TextLink } from "@/components/Button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publisher?: string; view?: string; sort?: string; dir?: string }>;
};

// The Cards/Grid switch only appears from this many editions on (DESIGN.md §6)
const TOGGLE_FROM = 4;
const SORTS: { key: SortKey; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "publisher", label: "Publisher" },
  { key: "name", label: "Name" },
];
// Longer original titles get the smaller title size in the band
const LONG_TITLE = 28;

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const work = id ? await getTitlePage(id) : null;
  return { title: work ? `${work.original_title} · Shelfhound` : "Title not found · Shelfhound" };
}

export default async function TitlePage({ params, searchParams }: PageProps) {
  const id = parseId((await params).id);
  const work = id ? await getTitlePage(id) : null;
  if (!work) notFound();

  const query = await searchParams;
  const allEditions = sortEditions(work);
  const facts = summarize(allEditions);
  const photos = collectPhotos(allEditions);
  const publishers = publisherCounts(allEditions);

  const publisherId = parseId(query.publisher);
  const activePublisher = publishers.some((p) => p.id === publisherId) ? publisherId : null;
  const sort: SortKey = SORTS.some((o) => o.key === query.sort) ? (query.sort as SortKey) : "year";
  const dir: SortDir = query.dir === "desc" ? "desc" : "asc";
  const editions = sortRows(filterByPublisher(allEditions, activePublisher).map((e) => toEditionRow(e, work.id)), sort, dir);
  const showToggle = allEditions.length >= TOGGLE_FROM;
  // Cards is the default; with fewer than four editions there is no switch and always Cards
  const view = showToggle && query.view === "grid" ? "grid" : "cards";

  // Links keep the other choices; defaults (no publisher, cards, year ascending) stay out of the URL
  const hrefWith = (changes: Partial<Record<"publisher" | "view" | "sort" | "dir", string | null>>) => {
    const state: Record<string, string | null> = {
      publisher: activePublisher ? String(activePublisher) : null,
      view: view === "grid" ? "grid" : null,
      sort: sort === "year" ? null : sort,
      dir: dir === "desc" ? "desc" : null,
      ...changes,
    };
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) if (value) next.set(key, value);
    const qs = next.toString();
    return `/titles/${work.id}${qs ? `?${qs}` : ""}#editions`;
  };

  const sortOptions = SORTS.map((option) => {
    const active = option.key === sort;
    // Clicking the active sort reverses it; another sort starts ascending
    const nextDir = active && dir === "asc" ? "desc" : "asc";
    return {
      value: option.key,
      label: active ? `${option.label} ${dir === "asc" ? "▲" : "▼"}` : option.label,
      ariaLabel: active
        ? `Sorted by ${option.label.toLowerCase()}, ${dir === "asc" ? "ascending" : "descending"}. Reverse order`
        : `Sort by ${option.label.toLowerCase()}`,
      href: hrefWith({ sort: option.key === "year" ? null : option.key, dir: nextDir === "desc" ? "desc" : null }),
    };
  });

  const authors = (work.work_authors || []).map((wa) => wa.author).filter((a) => a !== null);
  const englishTitle =
    work.english_title && work.english_title !== work.original_title ? work.english_title : null;

  // Data line in IBM Plex Mono; empty facts are left out (DESIGN.md §6 Titelpagina)
  const dataLine = [
    work.original_publication_year && <span key="year">First published {work.original_publication_year}</span>,
    work.original_language && <span key="lang">Original language: {work.original_language}</span>,
    work.wiki_link && (
      <a
        key="wiki"
        href={work.wiki_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:no-underline sm:min-h-0"
      >
        Wikipedia ↗
      </a>
    ),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/titles" standalone>Titles</TextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {work.original_title}
          </span>
        </nav>

        <YellowBand
          above={englishTitle}
          title={work.original_title}
          size={work.original_title.length > LONG_TITLE ? "lg" : "xl"}
          count={{
            value: facts.editions,
            label: facts.editions === 1 ? "edition" : "editions",
            labelPosition: "below",
            note:
              facts.editions > 0 ? (
                <>
                  {facts.publishers} {facts.publishers === 1 ? "publisher" : "publishers"}
                  {facts.years && <><br />{facts.years}</>}
                  {facts.languages.length > 0 && <><br />{facts.languages.join(", ")}</>}
                </>
              ) : null,
          }}
        >
          {authors.length > 0 && (
            <div className="text-[22px] font-medium leading-7 tracking-[-0.01em] md:text-[28px] md:leading-9">
              by{" "}
              {authors.map((author, i) => (
                <span key={author.id}>
                  {i > 0 && ", "}
                  <Link href={`/author/${author.id}`} className="underline underline-offset-[3px] hover:no-underline">
                    {author.name}
                  </Link>
                </span>
              ))}
            </div>
          )}
          {dataLine.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm leading-6">{dataLine}</div>
          )}
        </YellowBand>
      </div>

      <section aria-labelledby="photographs" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="photographs" className="text-[28px] leading-[34px]">
            Photographs
          </h2>
          {photos.length > 0 && (
            <span className="font-mono text-[13px] text-creme-gedempt">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </span>
          )}
        </div>
        {photos.length > 0 ? (
          <PhotoMosaic photos={photos} />
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-[92px] w-full items-center justify-center bg-mat text-[13px] font-semibold text-inkt sm:w-40">
              No photographs yet
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[15px] text-creme-gedempt">
                This title has no photographs. Do you have one we may use? Send it with your name and the source.
              </p>
              <div>
                <Button variant="secondary" href="/about#suggest">
                  Send a photograph
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="editions" aria-labelledby="editions-heading" className="flex scroll-mt-24 flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="editions-heading" className="text-[28px] leading-[34px]">
            Editions
          </h2>
          <span aria-live="polite" className="font-mono text-[13px] text-creme-gedempt">
            {activePublisher ? `${editions.length} of ${allEditions.length}` : allEditions.length}{" "}
            {allEditions.length === 1 ? "edition" : "editions"}
          </span>
        </div>

        {allEditions.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
            <p className="text-[22px] font-extrabold leading-7 tracking-[-0.02em]">No editions recorded yet</p>
            <p className="text-sm text-creme-gedempt">
              The editions of this title have not been added to the database yet.
            </p>
            <TextLink href="/titles" standalone className="text-sm">
              ← Back to titles
            </TextLink>
          </div>
        ) : (
          <>
            {allEditions.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                {publishers.length > 1 ? (
                  <div role="group" aria-label="Filter by publisher" className="flex flex-wrap gap-2">
                    <FilterChip href={hrefWith({ publisher: null })} selected={!activePublisher} count={allEditions.length}>
                      All
                    </FilterChip>
                    {publishers.map((p) => (
                      <FilterChip
                        key={p.id}
                        href={hrefWith({ publisher: String(p.id) })}
                        selected={activePublisher === p.id}
                        count={p.count}
                      >
                        {p.name}
                      </FilterChip>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] text-creme-gedempt">Sort by</span>
                    <ViewToggle label="Sort by" current={sort} options={sortOptions} />
                  </div>
                  {showToggle && (
                    <ViewToggle
                      current={view}
                      options={[
                        { value: "cards", label: "Cards", href: hrefWith({ view: null }) },
                        { value: "grid", label: "Grid", href: hrefWith({ view: "grid" }) },
                      ]}
                    />
                  )}
                </div>
              </div>
            )}

            {view === "cards" ? (
              <div className="flex flex-col gap-4">
                {editions.map((e) => (
                  <EditionFeatureCard
                    key={e.id}
                    href={`/edition/${e.id}?from=${work.id}`}
                    title={e.title}
                    publisher={e.publisher?.name}
                    year={e.year}
                    binding={e.binding}
                    pages={e.pages}
                    illustrators={e.illustrators}
                    includes={e.includes}
                    variants={e.variants}
                    note={e.note}
                    photos={e.photos}
                    counts={countLine(e)}
                    otherTitles={e.otherTitles}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
                {editions.map((e) => (
                  <EditionCard
                    key={e.id}
                    href={`/edition/${e.id}?from=${work.id}`}
                    title={e.title}
                    publisher={e.publisher?.name}
                    year={e.year}
                    binding={e.binding}
                    illustrators={e.illustrators}
                    includes={e.includes}
                    variants={e.variants}
                    printings={e.printings}
                    photo={e.photos[0] ?? null}
                    otherTitles={e.otherTitles}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
