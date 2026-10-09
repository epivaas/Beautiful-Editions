import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getEditionPage } from "@/app/lib/editionPageQuery";
import {
  bandCounts,
  containsTitles,
  contributorsByRole,
  toLimitedCards,
  toPrintingRows,
  worksOf,
} from "@/app/lib/editionPage";
import { collectPhotos, includesOf } from "@/app/lib/titlePage";
import YellowBand from "@/components/YellowBand";
import PhotoMosaic from "@/components/PhotoMosaic";
import FactGrid from "@/components/FactGrid";
import LimitedEditionCard from "@/components/LimitedEditionCard";
import PrintingsTable from "@/components/PrintingsTable";
import TitleChips from "@/components/TitleChips";
import { IncludesChip } from "@/components/Chip";
import { TextLink } from "@/components/Button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

// Longer edition titles get the smaller title size in the band
const LONG_TITLE = 40;

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const edition = id ? await getEditionPage(id) : null;
  if (!edition) return { title: "Edition not found · Shelfhound" };
  return { title: [edition.title, edition.publisher?.name.trim(), "Shelfhound"].filter(Boolean).join(" · ") };
}

const INLINE_LINK = "underline underline-offset-[3px] hover:no-underline";

/** "A, B and C" */
function joinNames(names: ReactNode[]) {
  return names.map((name, i) => (
    <span key={i}>
      {i > 0 && (i === names.length - 1 ? " and " : ", ")}
      {name}
    </span>
  ));
}

export default async function EditionPage({ params, searchParams }: PageProps) {
  const id = parseId((await params).id);
  const edition = id ? await getEditionPage(id) : null;
  if (!edition) notFound();

  const fromId = parseId((await searchParams).from);
  const works = worksOf(edition);
  const { current, titles } = containsTitles(works, fromId);
  const authors = [
    ...new Map(
      works.flatMap((w) => (w.work_authors ?? []).map((wa) => wa.author)).filter((a) => a !== null).map((a) => [a.id, a])
    ).values(),
  ];
  const role = contributorsByRole(edition.edition_contributors);
  const subs = edition.sub_editions ?? [];
  const limited = toLimitedCards(subs, edition.title);
  const printings = toPrintingRows(subs, edition.title);
  // All photos of the edition and its sub-editions, main photo first
  const photos = collectPhotos([{ ...edition, edition_contributors: null }]);
  const includes = includesOf(edition);
  const counts = bandCounts({
    titles: works.length,
    limited: limited.length,
    printings: printings.length,
    photos: photos.length,
  });

  const authorLinks = authors.map((a) => (
    <Link key={a.id} href={`/author/${a.id}`} className={INLINE_LINK}>
      {a.name}
    </Link>
  ));
  const credits = [
    authorLinks.length > 0 && <span key="by">by {joinNames(authorLinks)}</span>,
    role("Translator").length > 0 && <span key="tr">translated by {joinNames(role("Translator"))}</span>,
    role("Illustrator").length > 0 && <span key="il">illustrated by {joinNames(role("Illustrator"))}</span>,
  ].filter(Boolean);

  // Some names in the database end with a space
  const publisherName = edition.publisher?.name.trim() || null;
  const crumbLabel = [publisherName, edition.publication_year].filter(Boolean).join(", ");
  // Loose links in the facts grid: 44 px tap target on phones
  const FACT_LINK = "inline-flex min-h-11 items-center text-amber hover:underline sm:min-h-0";

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/titles" standalone>
            Titles
          </TextLink>
          {current && (
            <>
              <span aria-hidden="true">/</span>
              <TextLink href={`/titles/${current.id}`} standalone>
                {current.original_title}
              </TextLink>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {crumbLabel || edition.title}
          </span>
        </nav>

        <YellowBand
          title={edition.title}
          size={edition.title.length > LONG_TITLE ? "md" : "lg"}
          publisher={publisherName}
          count={
            counts && {
              value: counts.value,
              label: counts.label,
              labelPosition: "below",
              note:
                counts.lines.length > 0 ? (
                  <>
                    {counts.lines.map((line, i) => (
                      <span key={line}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </>
                ) : null,
            }
          }
        >
          {edition.publication_year && (
            <div className="text-xl font-medium leading-7 md:text-[22px] md:leading-[30px]">{edition.publication_year}</div>
          )}
          {credits.length > 0 && (
            <div className="text-base leading-6">
              {credits.map((part, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {part}
                </span>
              ))}
            </div>
          )}
          {titles.length > 1 && <TitleChips titles={titles} />}
        </YellowBand>
      </div>

      {photos.length > 0 && (
        <section aria-label="Photographs">
          <PhotoMosaic photos={photos} />
        </section>
      )}

      <div className="flex flex-col gap-7">
        {includes.length > 0 && (
          <div className="flex items-center gap-4 rounded-card border border-lijn bg-oppervlak px-[18px] py-3.5">
            <span className="w-[76px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt">
              Includes
            </span>
            <div className="flex flex-wrap gap-2">
              {includes.map((item) => (
                <IncludesChip key={item}>{item}</IncludesChip>
              ))}
            </div>
          </div>
        )}

        <section aria-labelledby="publication" className="flex flex-col gap-3.5">
          <h2 id="publication" className="text-[26px] leading-8">
            Publication
          </h2>
          <FactGrid
            items={[
              {
                label: "Publisher",
                value: edition.publisher && (
                  <Link href={`/publishers-series/${edition.publisher.id}`} className={FACT_LINK}>
                    {publisherName}
                  </Link>
                ),
              },
              { label: "Year", value: edition.publication_year, mono: true },
              {
                label: authors.length > 1 ? "Authors" : "Author",
                value:
                  authors.length > 0 &&
                  joinNames(
                    authors.map((a) => (
                      <Link key={a.id} href={`/author/${a.id}`} className={FACT_LINK}>
                        {a.name}
                      </Link>
                    ))
                  ),
              },
              { label: "Translator", value: role("Translator").join(", ") },
              { label: "Illustrators", value: role("Illustrator").join(", ") },
              { label: "Introduction", value: role("Introduction").join(", ") },
              { label: "Editor", value: role("Editor").join(", ") },
              { label: "Series", value: edition.series?.name },
              { label: "Catalogue no.", value: edition.catalogue_number, mono: true },
              { label: "ISBN", value: edition.isbn, mono: true },
              { label: "Language", value: edition.language },
              {
                label: "Publisher's page",
                value: edition.publisher_url && (
                  <a href={edition.publisher_url} target="_blank" rel="noopener noreferrer" className={FACT_LINK}>
                    Visit ↗
                  </a>
                ),
              },
            ]}
          />
        </section>

        <section aria-labelledby="physical" className="flex flex-col gap-3.5">
          <h2 id="physical" className="text-[26px] leading-8">
            Physical description
          </h2>
          <FactGrid
            items={[
              { label: "Binding", value: edition.binding_type },
              { label: "Pages", value: edition.pages_description, mono: true },
              { label: "Format", value: edition.size_dimensions },
              { label: "Typeface", value: edition.typeface },
              { label: "Printer", value: edition.printer },
              { label: "Binder", value: edition.binder },
            ]}
          />
        </section>

        {(edition.notes || edition.details) && (
          <section aria-labelledby="note" className="flex max-w-[68ch] flex-col gap-3.5">
            <h2 id="note" className="text-[26px] leading-8">
              Note
            </h2>
            {[edition.notes, edition.details].filter(Boolean).map((text, i) => (
              <p key={i} className="m-0 whitespace-pre-line text-[17px] leading-[27px]">
                {text}
              </p>
            ))}
          </section>
        )}
      </div>

      {limited.length > 0 && (
        <section aria-labelledby="limited" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="limited" className="text-[26px] leading-8">
              Limited editions
            </h2>
            <span className="font-mono text-[13px] text-creme-gedempt">
              {limited.length} {limited.length === 1 ? "limited edition" : "limited editions"}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {limited.map((card) => (
              <LimitedEditionCard key={card.id} {...card} />
            ))}
          </div>
        </section>
      )}

      {printings.length > 0 && (
        <section aria-labelledby="printings" className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="printings" className="text-[26px] leading-8">
              Printings
            </h2>
            <span className="font-mono text-[13px] text-creme-gedempt">
              {printings.length} {printings.length === 1 ? "printing" : "printings"}
            </span>
          </div>
          {printings.some((p) => p.expandable) && (
            <p className="m-0 text-[13px] text-creme-gedempt">
              <span aria-hidden="true" className="text-amber">
                ▶
              </span>{" "}
              Open a row for details and photos
            </p>
          )}
          <PrintingsTable rows={printings} />
        </section>
      )}
    </div>
  );
}
