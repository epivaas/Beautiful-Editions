import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { getPublisherList } from "@/app/lib/overviewQueries";
import { getPublisherTitles } from "@/app/lib/publisherPageQuery";
import { GROUP_BYS, groupPage, groupRows, inRange, isGroupBy, pageOfGroup, publisherTitleRows, yearCounts } from "@/app/lib/publisherPage";
import { activeSpan, matchesFilter, overviewHref, paginate } from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import ListFilter from "@/components/ListFilter";
import EmptyState from "@/components/EmptyState";
import YearBars from "@/components/YearBars";
import GroupedTitleList from "@/components/GroupedTitleList";
import GroupBySelect from "@/components/GroupBySelect";
import Pagination from "@/components/Pagination";
import { ActiveFilter } from "@/components/Chip";
import { TextLink } from "@/components/Button";

const PAGE_SIZE = 50;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; q?: string; year?: string; from?: string; to?: string; group?: string; dir?: string; page?: string }>;
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
  const group = isGroupBy(query.group) ? query.group : "year";
  const all = publisherTitleRows(data.editions, data.works);
  const filtered = q
    ? all.filter((r) => matchesFilter([r.title, r.englishTitle, ...r.authors.map((a) => a.name), ...r.illustrators], q))
    : all;
  // The bar shows every year after the text filter; a dragged period then narrows the list
  const counts = yearCounts(filtered);
  const from = Number(query.from);
  const to = Number(query.to);
  const range =
    Number.isInteger(from) && Number.isInteger(to) && query.from && query.to
      ? { from: Math.min(from, to), to: Math.max(from, to) }
      : null;
  const sorted = groupRows(range ? inRange(filtered, range.from, range.to) : filtered, group, dir);
  const year = Number(query.year);
  const selected = group === "year" && Number.isInteger(year) && sorted.some((r) => r.year === year) ? year : null;
  // A chosen year opens the page on which it starts
  const pageNumber = selected !== null && !query.page ? pageOfGroup(sorted, `y-${selected}`, PAGE_SIZE) : Number(query.page ?? 1);
  const page = paginate(sorted, pageNumber, PAGE_SIZE);
  const items = groupPage(sorted, (page.page - 1) * PAGE_SIZE, PAGE_SIZE);

  const base = `/publishers-series/${publisher.id}`;
  const state = {
    q,
    group: group === "year" ? null : group,
    dir,
    from: range ? String(range.from) : null,
    to: range ? String(range.to) : null,
    year: selected !== null ? String(selected) : null,
    page: String(page.page),
  };
  const defaults = { dir: "desc", page: "1" };
  const href = (changes: Record<string, string | null>, hash = "") => overviewHref(base, state, changes, defaults) + hash;
  // A click on a bar jumps to that year when the list is grouped by year, and filters on it otherwise
  const yearHrefs = Object.fromEntries(
    counts.map((c) => [
      c.year,
      group === "year"
        ? href({ year: String(c.year), from: null, to: null }, `#y-${c.year}`)
        : href({ from: String(c.year), to: String(c.year), year: null }),
    ])
  );

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

      <YearBars
        counts={counts}
        selected={selected}
        range={range}
        yearHrefs={yearHrefs}
        rangeHref={href({ from: "__FROM__", to: "__TO__", year: null })}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          {/* A filter keeps the grouping, order and period, but not the chosen year or the page */}
          <ListFilter
            action={base}
            q={q}
            keep={{ group: state.group, dir: dir === "desc" ? null : dir, from: state.from, to: state.to }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selected !== null && <ActiveFilter removeHref={href({ year: null })}>{`Jumped to ${selected}`}</ActiveFilter>}
          {range && (
            <ActiveFilter removeHref={href({ from: null, to: null })}>
              {range.from === range.to ? String(range.from) : `${range.from} to ${range.to}`}
            </ActiveFilter>
          )}
          <GroupBySelect
            value={group}
            options={GROUP_BYS.map((g) => ({ key: g.key, label: g.label, href: href({ group: g.key === "year" ? null : g.key, year: null }) }))}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        q || range ? (
          <EmptyState
            title="No titles match"
            text="Check the spelling, try fewer words or another period."
            secondary={{ href: base, label: "Clear filter" }}
          />
        ) : (
          <EmptyState
            title="Nothing here yet"
            text="There are no titles for this publisher in the database yet. An empty list can also mean the data is still being added."
            secondary={{ href: "/publishers", label: "← Back to publishers" }}
          />
        )
      ) : (
        <>
          <GroupedTitleList
            items={items}
            group={group}
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
