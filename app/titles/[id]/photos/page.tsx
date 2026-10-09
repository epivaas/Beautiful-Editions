import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTitlePage } from "@/app/lib/titlePageQuery";
import { collectPhotos, sortEditions } from "@/app/lib/titlePage";
import { filterPhotos, photoFilters } from "@/app/lib/photos";
import PhotoTile from "@/components/PhotoTile";
import PhotoLightbox from "@/components/PhotoLightbox";
import EmptyState from "@/components/EmptyState";
import { FilterChip } from "@/components/Chip";
import { Button, TextLink } from "@/components/Button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edition?: string; sub?: string; show?: string }>;
};

// Photos per "Show more"
const STEP = 24;

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const work = id ? await getTitlePage(id) : null;
  return { title: work ? `Photographs · ${work.original_title} · Shelfhound` : "Photographs · Shelfhound" };
}

/**
 * Photographs of a title (board Fotos, step 2): its own address, a filter per edition and per limited
 * edition, rows of equal height with every photo on the mat at its own ratio, and "Show more".
 */
export default async function PhotographsPage({ params, searchParams }: PageProps) {
  const id = parseId((await params).id);
  const work = id ? await getTitlePage(id) : null;
  if (!work) notFound();
  const query = await searchParams;

  const all = collectPhotos(sortEditions(work));
  const filters = photoFilters(all);
  const edition = parseId(query.edition);
  const sub = parseId(query.sub);
  const photos = filterPhotos(all, { edition, sub });
  const shown = Math.max(STEP, Math.min(photos.length, Number(query.show) || STEP));
  const visible = photos.slice(0, shown);
  const left = photos.length - visible.length;

  const base = `/titles/${work.id}/photos`;
  const hrefFor = (param: { edition?: number; sub?: number }) => {
    const qs = new URLSearchParams();
    if (param.edition) qs.set("edition", String(param.edition));
    if (param.sub) qs.set("sub", String(param.sub));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };
  const current = sub ? `s${sub}` : edition ? `e${edition}` : "all";
  const moreHref = (() => {
    const qs = new URLSearchParams();
    if (edition) qs.set("edition", String(edition));
    if (sub) qs.set("sub", String(sub));
    qs.set("show", String(shown + STEP));
    return `${base}?${qs.toString()}`;
  })();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/titles" standalone>
            Titles
          </TextLink>
          <span aria-hidden="true">/</span>
          <TextLink href={`/titles/${work.id}`} standalone>
            {work.original_title}
          </TextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            Photographs
          </span>
        </nav>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-3">
            <h1 className="m-0 text-4xl leading-none tracking-[-0.03em] sm:text-5xl sm:leading-[52px]">Photographs</h1>
            <span className="font-mono text-[15px] text-creme-gedempt">{all.length.toLocaleString("en-US")}</span>
          </div>
          <TextLink href={`/titles/${work.id}`} standalone className="text-sm">
            ← Back to {work.original_title}
          </TextLink>
        </div>
        {filters.length > 0 && (
          <div role="group" aria-label="Filter by edition" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <FilterChip key={f.key} href={hrefFor(f.param)} count={f.count} selected={f.key === current}>
                {f.label}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <EmptyState
          title="No photographs yet"
          text="Do you have one we may use? Send it with your name and the source."
          secondary={{ href: `${base}?suggest=photograph`, label: "Send a photograph" }}
        />
      ) : (
        <>
          {/* Rows of equal height: each tile is as wide as its photo and grows to fill the row */}
          {/* The spacer at the end keeps the last row from stretching its photos across the page */}
          <div className="flex flex-wrap gap-3 after:block after:flex-[10_0_auto] after:content-['']">
            {visible.map((p) => (
              <div key={p.id} className="h-[140px] min-w-[100px] max-w-full flex-[1_0_auto] sm:h-[200px]">
                <PhotoTile src={p.src} alt={p.alt} credit={p.credit} padding={8} photoId={p.id} eager className="h-full" />
              </div>
            ))}
          </div>
          {left > 0 && (
            <div className="flex justify-center">
              <Button href={moreHref} variant="secondary" scroll={false}>
                Show more · {left.toLocaleString("en-US")} left
              </Button>
            </div>
          )}
          <Suspense fallback={null}>
            <PhotoLightbox photos={photos} />
          </Suspense>
        </>
      )}
    </div>
  );
}
