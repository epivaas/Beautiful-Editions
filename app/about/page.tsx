import type { Metadata } from "next";
import YellowBand from "@/components/YellowBand";
import FactGrid from "@/components/FactGrid";
import NoteText from "@/components/NoteText";
import { IncludesChip, VariantLabel } from "@/components/Chip";
import { getAboutCounts } from "@/app/lib/aboutQueries";
import { roundedCount } from "@/app/lib/home";
import { ABOUT_INTRO, COLOPHON, FAQ, SPOTTED_AN_ERROR, TERMS, WHAT_IT_IS } from "./content";

export const metadata: Metadata = { title: "About · Shelfhound" };

function Heading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="m-0 text-[32px] leading-9">
      {children}
    </h2>
  );
}

/**
 * About (board About en randgevallen): what the site is, a few numbers, how to read the data, the FAQ,
 * "Spotted an error?" and the colophon. The texts live in ./content.ts.
 */
export default async function AboutPage() {
  const counts = await getAboutCounts();

  return (
    <div className="flex flex-col gap-14">
      <YellowBand size="md" title="About Shelfhound" subtitle="A reference for beautifully illustrated editions" meta={ABOUT_INTRO} />

      <section aria-labelledby="what" className="flex max-w-[760px] flex-col gap-4">
        <Heading id="what">What it is</Heading>
        <NoteText texts={WHAT_IT_IS} />
      </section>

      <section aria-labelledby="numbers" className="flex flex-col gap-4">
        <Heading id="numbers">In numbers</Heading>
        <FactGrid
          items={[
            { label: "Titles", value: roundedCount(counts.titles), mono: true },
            { label: "Authors", value: roundedCount(counts.authors), mono: true },
            { label: "Editions", value: roundedCount(counts.editions), mono: true },
            { label: "Photographs", value: roundedCount(counts.photographs), mono: true },
          ]}
        />
      </section>

      <section aria-labelledby="read" className="flex flex-col gap-4">
        <Heading id="read">How to read the data</Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((t) => (
            <div key={t.term} className="flex flex-col gap-3 rounded-card border border-lijn bg-oppervlak p-5">
              <h3 className="m-0 text-[22px] leading-7">{t.term}</h3>
              <p className="m-0 text-sm text-creme-gedempt">{t.text}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {t.examples.map((e) =>
                  t.kind === "variant" ? (
                    <VariantLabel key={e}>{e}</VariantLabel>
                  ) : t.kind === "includes" ? (
                    <IncludesChip key={e}>{e}</IncludesChip>
                  ) : (
                    <span key={e} className="inline-flex min-h-7 items-center rounded-ctl border border-lijn px-[11px] font-mono text-[13px]">
                      {e}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-h" className="flex max-w-[760px] scroll-mt-24 flex-col gap-4">
        <Heading id="faq-h">FAQ</Heading>
        <div className="overflow-hidden rounded-card border border-lijn">
          {FAQ.map((item, i) => (
            <details key={item.question} open={i === 0} className="group border-t border-lijn bg-oppervlak first:border-t-0">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-2 text-[17px] font-bold hover:bg-rij-hover [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="shrink-0 font-mono text-xl text-amber">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="m-0 px-5 pb-5 text-[15px] leading-6 text-creme-gedempt">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="suggest" aria-labelledby="suggest-h" className="flex max-w-[760px] scroll-mt-24 flex-col gap-3">
        <Heading id="suggest-h">Spotted an error?</Heading>
        <p className="m-0 text-[17px] leading-[27px]">{SPOTTED_AN_ERROR}</p>
        {/* The form comes with the comments queue (DESIGN.md: Opmerkingen); nothing pretends to send until then */}
        <p className="m-0 text-sm text-creme-gedempt">The form opens soon.</p>
      </section>

      <section aria-labelledby="colophon" className="flex max-w-[760px] flex-col gap-3 border-t border-lijn pt-8">
        <h2 id="colophon" className="m-0 text-[22px] leading-7">
          Colophon
        </h2>
        {COLOPHON.map((line) => (
          <p key={line} className="m-0 text-sm text-creme-gedempt">
            {line}
          </p>
        ))}
      </section>
    </div>
  );
}
