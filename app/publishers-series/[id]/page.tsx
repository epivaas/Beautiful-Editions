import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { getPublisherList } from "@/app/lib/overviewQueries";
import { getPublisherTitles } from "@/app/lib/publisherPageQuery";
import { groupPage, pageOfYear, publisherTitleRows, sortTitleRows, yearCounts } from "@/app/lib/publisherPage";
import { activeSpan, matchesFilter, overviewHref, paginate } from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import ListFilter from "@/components/ListFilter";
import YearBars from "@/components/YearBars";
import YearGroupedList from "@/components/YearGroupedList";
import Pagination from "@/components/Pagination";
import { ActiveFilter } from "@/components/Chip";
import { TextLink } from "@/components/Button";

const PAGE_SIZE = 50;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; q?: string; year?: string; dir?: string; page?: string }>;
};

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getPublisher(id: number) {
  const { data } = await supabase.from("publishers").select("id, name").eq("id", id).maybeSingle();
  return data as { id: number; name: string } | null;
}

/** Only whether a series exists: old links to a series used this route. */
async function seriesExists(id: number) {
  const { data } = await supabase.from("series").select("id").eq("id", id).maybeSingle();
  return data !== null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const publisher = id ? await getPublisher(id) : null;
  return { title: publisher ? `${publisher.name.trim()} · Shelfhound` : "Publisher · Shelfhound" };
}

/**
 * Publisher page (board Overzichten, "Titles van een publisher"): the band, a bar per publication year
 * that also jumps to that year, a filter and the titles grouped per year with sticky year headings.
 */
export default async function PublisherPage({ params, searchParams }: PageProps) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const query = await searchParams;

  // Series have their own page now; ?kind=series was how the shared route asked for one
  const publisher = query.kind === "series" ? null : await getPublisher(id);
  if (!publisher) {
    if (await seriesExists(id)) permanentRedirect(`/series/${id}`);
    notFound();
  }

  const [data, list] = await Promise.all([getPublisherTitles(publisher.id), getPublisherList()]);
  const name = publisher.name.trim();
  const listRow = list.find((p) => p.id === publisher.id);
  const span = listRow ? activeSpan([listRow.firstYear, listRow.lastYear], new Date().getFullYear()) : null;

  const q = query.q?.trim() || null;
  const dir = query.dir === "asc" ? "asc" : "desc";
  const all = publisherTitleRows(data.editions, data.works);
  const filtered = q
    ? all.filter((r) => matchesFilter([r.title, r.englishTitle, ...r.authors.map((a) => a.name), ...r.illustrators], q))
    : all;
  const sorted = sortTitleRows(filtered, dir);
  const counts = yearCounts(filtered);
  const year = Number(query.year);
  const selected = Number.isInteger(year) && counts.some((c) => c.year === year) ? year : null;
  // A chosen year opens the page on which it starts
  const pageNumber = selected !== null && !query.page ? pageOfYear(sorted, selected, PAGE_SIZE) : Number(query.page ?? 1);
  const page = paginate(sorted, pageNumber, PAGE_SIZE);
  const items = groupPage(sorted, (page.page - 1) * PAGE_SIZE, PAGE_SIZE);

  const base = `/publishers-series/${publisher.id}`;
  const state = { q, dir, year: selected !== null ? String(selected) : null, page: String(page.page) };
  const defaults = { dir: "desc", page: "1" };
  const href = (changes: Record<string, string | null>, hash = "") => overviewHref(base, state, changes, defaults) + hash;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/publishers" standalone>
            Publishers
          </TextLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {name}
          </span>
        </nav>
        <ListBand
          pill="Publisher"
          title={name}
          sentence={["Publisher", span].filter(Boolean).join(" · ")}
          count={listRow?.titles ?? new Set(all.map((r) => r.workId)).size}
          label={["title", "titles"]}
        />
      </div>

      <YearBars counts={counts} selected={selected} hrefFor={(y) => href({ year: String(y) }, `#y-${y}`)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* A filter keeps the order, but not the chosen year or the page */}
          <ListFilter action={base} q={q} keep={{ dir: dir === "desc" ? null : dir }} />
        </div>
        {selected !== null && <ActiveFilter removeHref={href({ year: null })}>{`Jumped to ${selected}`}</ActiveFilter>}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
          <p className="m-0 text-[22px] font-extrabold leading-7 tracking-[-0.02em]">
            {q ? "No titles match" : "No titles yet"}
          </p>
          {q ? (
            <>
              <p className="m-0 text-sm text-creme-gedempt">Check the spelling or try fewer words.</p>
              <TextLink href={base} standalone className="text-sm">
                Clear filter
              </TextLink>
            </>
          ) : (
            <p className="m-0 text-sm text-creme-gedempt">There are no editions of this publisher on Shelfhound yet.</p>
          )}
        </div>
      ) : (
        <>
          <YearGroupedList
            items={items}
            selected={selected}
            dir={dir}
            q={q}
            sortHref={href({ dir: dir === "desc" ? "asc" : "desc", year: null })}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[13px] text-creme-gedempt">
              {page.from.toLocaleString("en-US")} to {page.to.toLocaleString("en-US")} of {page.total.toLocaleString("en-US")}
            </span>
            {page.totalPages > 1 && (
              <Pagination page={page.page} totalPages={page.totalPages} hrefFor={(p) => href({ page: String(p), year: null })} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
