import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getPublisherSpotlight, getRecentEditions, getTitleSpotlight } from "@/app/lib/homeQueries";
import { getPublisherList } from "@/app/lib/overviewQueries";
import { newSeed, publisherCountParts, roundedCount, seededShuffle } from "@/app/lib/home";
import { toEditionRow, type TitleEditionRow } from "@/app/lib/titlePage";
import HomeBand from "@/components/HomeBand";
import SpotlightCard from "@/components/SpotlightCard";
import EditionCard from "@/components/EditionCard";
import { Button, TextLink } from "@/components/Button";

export const metadata: Metadata = {
  title: "Shelfhound · Find the edition worth owning",
  description: "A reference for beautifully illustrated editions: titles, editions, variants, printings and photographs.",
};

type PageProps = { searchParams: Promise<{ shuffle?: string }> };

function Row({
  id,
  title,
  sentence,
  link,
  children,
}: {
  id: string;
  title: string;
  sentence: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="flex scroll-mt-24 flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id={`${id}-heading`} className="m-0 text-[32px] leading-[38px]">
            {title}
          </h2>
          <span className="text-sm text-creme-gedempt">{sentence}</span>
        </div>
        {link && (
          <TextLink href={link.href} standalone className="text-sm">
            {link.label}
          </TextLink>
        )}
      </div>
      {children}
    </section>
  );
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

function Card({ edition, fromWork }: { edition: TitleEditionRow; fromWork?: number }) {
  const row = toEditionRow(edition, fromWork);
  const from = fromWork ?? edition.work_editions?.[0]?.work?.id;
  return (
    <EditionCard
      href={`/edition/${row.id}${from ? `?from=${from}` : ""}`}
      title={row.title}
      publisher={row.publisher?.name.trim()}
      year={row.year}
      binding={row.binding}
      variants={row.variants}
      photo={row.photos[0] ?? null}
    />
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const now = new Date();
  const shuffle = Number((await searchParams).shuffle);
  // A server component renders once per request, so a random seed per visit is intended here
  const seed = Number.isFinite(shuffle) && shuffle > 0 ? shuffle : newSeed();
  const nextSeed = newSeed();

  const [recent, titleSpotlight, publisherSpotlight, publishers] = await Promise.all([
    getRecentEditions(),
    getTitleSpotlight(now),
    getPublisherSpotlight(now),
    getPublisherList(),
  ]);
  const editionTotal = publishers.reduce((sum, p) => sum + p.editions, 0);
  const whatsNew = seededShuffle(recent, seed).slice(0, 4);

  return (
    <div className="flex flex-col gap-14">
      <HomeBand editions={roundedCount(editionTotal, 1000)} />

      <Row id="whats-new" title="What's new" sentence="A selection of recently added editions, different every visit">
        <div className={GRID}>
          {whatsNew.map((edition) => (
            <Card key={edition.id} edition={edition} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" href={`/?shuffle=${nextSeed}#whats-new`} scroll={false}>
            Show other editions
          </Button>
          <span className="text-[13px] text-creme-gedempt">A new selection from the editions added recently.</span>
        </div>
      </Row>

      {titleSpotlight && (
        <Row
          id="title-spotlight"
          title="Title in the spotlight"
          sentence="New pick every week"
          link={{ href: "/titles", label: "All titles →" }}
        >
          <div className={GRID}>
            <SpotlightCard
              eyebrow="Title in the spotlight"
              kind="title"
              name={titleSpotlight.work.title}
              byline={titleSpotlight.work.authors.length ? `by ${titleSpotlight.work.authors.join(", ")}` : null}
              count={`${titleSpotlight.editionCount} ${titleSpotlight.editionCount === 1 ? "edition" : "editions"}`}
              href={`/titles/${titleSpotlight.work.id}`}
              text={titleSpotlight.text}
              cta="View the title →"
            />
            {titleSpotlight.editions.map((edition) => (
              <Card key={edition.id} edition={edition} fromWork={titleSpotlight.work.id} />
            ))}
          </div>
        </Row>
      )}

      {publisherSpotlight && (
        <Row
          id="publisher-spotlight"
          title="Publisher in the spotlight"
          sentence="New pick every two weeks"
          link={{ href: "/publishers", label: "All publishers →" }}
        >
          <div className={GRID}>
            <SpotlightCard
              eyebrow="Publisher in the spotlight"
              kind="publisher"
              name={publisherSpotlight.publisher.name}
              count={publisherCountParts(publisherSpotlight.publisher).map((part, i) => (
                <span key={part.text}>
                  {i > 0 && " · "}
                  <span className="font-semibold text-creme">{part.value.toLocaleString("en-US")}</span>
                  {part.text.slice(part.value.toLocaleString("en-US").length)}
                </span>
              ))}
              href={`/publishers-series/${publisherSpotlight.publisher.id}`}
              text={publisherSpotlight.text}
              cta="View the publisher →"
            />
            {publisherSpotlight.editions.map((edition) => (
              <Card key={edition.id} edition={edition} />
            ))}
          </div>
        </Row>
      )}
    </div>
  );
}
