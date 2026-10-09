import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getVariantPage } from "@/app/lib/editionPageQuery";
import { contributorsByRole, limitedEditionName, toLimitedCards, worksOf } from "@/app/lib/editionPage";
import { variantChips, variantFacts } from "@/app/lib/variantPage";
import { editionPlace, includesOf, subEditionPlace, toPhotos } from "@/app/lib/titlePage";
import YellowBand from "@/components/YellowBand";
import PhotoMosaic from "@/components/PhotoMosaic";
import PhotoLightbox from "@/components/PhotoLightbox";
import PhotoTile from "@/components/PhotoTile";
import FactGrid from "@/components/FactGrid";
import IncludesBar from "@/components/IncludesBar";
import NoteText from "@/components/NoteText";
import EditionCredits from "@/components/EditionCredits";
import LimitedEditionCard from "@/components/LimitedEditionCard";
import { FilterChip } from "@/components/Chip";
import { TextLink } from "@/components/Button";

type PageProps = { params: Promise<{ id: string }> };

// Longer edition titles get the smaller title size in the band
const LONG_TITLE = 32;
// Loose links in the facts grid: 44 px tap target on phones
const FACT_LINK = "inline-flex min-h-11 items-center text-amber hover:underline sm:min-h-0";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const page = id ? await getVariantPage(id) : null;
  if (!page) return { title: "Limited edition not found · Shelfhound" };
  const name = limitedEditionName(page.sub.limited_state?.name, page.sub.impression_label);
  return { title: [name, page.edition.title, "Shelfhound"].join(" · ") };
}

/**
 * Variant page (board Variantpagina, DESIGN.md §6): one limited sub-edition. The book's title is the
 * heading, the Gloed block says "Edition of 26", fields are compared with the edition. No printings.
 */
export default async function VariantPage({ params }: PageProps) {
  const id = parseId((await params).id);
  const page = id ? await getVariantPage(id) : null;
  if (!page) notFound();
  const { edition, sub } = page;
  // A printing has no page of its own: it lives in the edition's printings table
  if (!sub.is_limited_edition) redirect(`/edition/${edition.id}#printings`);

  const name = limitedEditionName(sub.limited_state?.name, sub.impression_label);
  const works = worksOf(edition);
  const current = works[0] ?? null;
  const authors = [
    ...new Map(
      works.flatMap((w) => (w.work_authors ?? []).map((wa) => wa.author)).filter((a) => a !== null).map((a) => [a.id, a])
    ).values(),
  ];
  const role = contributorsByRole(edition.edition_contributors);
  const subs = edition.sub_editions ?? [];
  const chips = variantChips(subs, sub.id);
  const others = toLimitedCards(subs, edition.title).filter((card) => card.id !== sub.id);
  // The variant's own photos; without them the edition's own (not those of other variants)
  const ownPhotos = toPhotos(sub.photos, `${edition.title}, ${name}`, subEditionPlace(edition, sub));
  const photos = ownPhotos.length > 0 ? ownPhotos : toPhotos(edition.photos, edition.title, editionPlace(edition));
  const editionPhotos = ownPhotos.length === 0 && photos.length > 0;
  const facts = variantFacts(sub, edition);
  const notes = [sub.impression_label, sub.details].filter((t): t is string => !!t?.trim());

  // Some names in the database end with a space
  const publisherName = edition.publisher?.name.trim() || null;
  const editionLabel = [publisherName, edition.publication_year].filter(Boolean).join(", ") || edition.title;

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
          <TextLink href={`/edition/${edition.id}`} standalone>
            {editionLabel}
          </TextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {name}
          </span>
        </nav>

        <YellowBand
          title={edition.title}
          size={edition.title.length > LONG_TITLE ? "lg" : "xl"}
          publisher={publisherName}
          subtitle={name}
          subtitleNote={edition.publication_year}
          // The Gloed block never disappears: without a print run it stays as an empty block
          count={
            sub.limited_edition_count
              ? { label: "Edition of", value: sub.limited_edition_count.toLocaleString("en-US"), labelPosition: "above" }
              : "empty"
          }
        >
          <EditionCredits authors={authors} translators={role("Translator")} illustrators={role("Illustrator")} />
        </YellowBand>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1.5 font-mono text-[13px] uppercase tracking-[0.08em] text-creme-gedempt">Limited editions</span>
              {chips.map((chip) => (
                <FilterChip key={chip.id} href={chip.href} count={chip.count} selected={chip.selected}>
                  {chip.name}
                </FilterChip>
              ))}
            </div>
          )}
          <TextLink href={`/edition/${edition.id}`} standalone className="text-sm">
            ← Back to the edition
          </TextLink>
        </div>
      </div>

      {/* The photo block never disappears: without any photo it shows one empty tile on the mat */}
      {photos.length > 0 ? (
        <>
          <PhotoMosaic
            photos={photos}
            note={editionPhotos ? "Photos of the edition" : undefined}
            allHref={current ? `/titles/${current.id}/photos?${editionPhotos ? `edition=${edition.id}` : `sub=${sub.id}`}` : undefined}
          />
          <Suspense fallback={null}>
            <PhotoLightbox photos={photos} />
          </Suspense>
        </>
      ) : (
        <section aria-labelledby="photographs" className="flex flex-col gap-4">
          <h2 id="photographs" className="m-0 text-[28px] leading-[34px]">
            Photographs
          </h2>
          <PhotoTile alt={`${edition.title}, ${name}`} className="h-[190px] w-full max-w-[320px]" />
        </section>
      )}

      <div className="flex flex-col gap-7">
        <IncludesBar items={includesOf(sub)} />

        {facts.length > 0 && (
          <section aria-labelledby="apart" className="flex flex-col gap-3.5">
            <h2 id="apart" className="text-[26px] leading-8">
              What sets this limited edition apart
            </h2>
            <FactGrid
              items={facts.map((f) => ({
                label: f.label,
                mono: f.mono,
                note: f.note,
                value: f.href ? (
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className={FACT_LINK}>
                    {f.value}
                  </a>
                ) : (
                  f.value
                ),
              }))}
            />
          </section>
        )}

        {notes.length > 0 && (
          <section aria-labelledby="note" className="flex max-w-[760px] flex-col gap-3.5">
            <h2 id="note" className="text-[26px] leading-8">
              Note
            </h2>
            <NoteText texts={notes} />
          </section>
        )}
      </div>

      {others.length > 0 && (
        <section aria-labelledby="others" className="flex flex-col gap-4">
          <h2 id="others" className="text-[26px] leading-8">
            Other limited editions
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {others.map((card) => (
              <LimitedEditionCard key={card.id} {...card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
