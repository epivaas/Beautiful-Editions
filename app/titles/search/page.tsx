import type { Metadata } from "next";
import Link from "next/link";
import { getAuthorList, getPublisherList, getTitleList, type AuthorListRow, type PublisherWithLimited, type TitleListRow } from "@/app/lib/overviewQueries";
import { getEditionIndex, getSearchOptions } from "@/app/lib/searchQueries";
import { joinNames } from "@/app/lib/names";
import { criteriaLabels, criteriaParams, facetCounts, filterEditions, hasCriteria, parseCriteria, type EditionSearchRow } from "@/app/lib/search";
import { matchesFilter, paginate, sortBy, type SortDir } from "@/app/lib/overview";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import DetailedSearchForm from "@/components/DetailedSearchForm";
import Highlight from "@/components/Highlight";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = { title: "Search · Shelfhound" };

const PAGE_SIZE = 50;

type PageProps = { searchParams: Promise<Record<string, string | undefined>> };

const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt";

function titleColumns(q: string): Column<TitleListRow>[] {
  return [
    {
      key: "title",
      label: "Title",
      width: "36%",
      render: (row) => (
        <Link href={`/titles/${row.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
          <span>
            <Highlight text={row.title} q={q} />
          </span>
        </Link>
      ),
    },
    {
      key: "englishTitle",
      label: "English title",
      width: "28%",
      render: (row) =>
        row.englishTitle && (
          <span className="text-sm text-creme-gedempt">
            <Highlight text={row.englishTitle} q={q} />
          </span>
        ),
    },
    {
      key: "authors",
      label: "Author",
      width: "24%",
      render: (row) =>
        row.authors.length > 0 && (
          <span className="text-sm">
            <Highlight text={joinNames(row.authors.map((a) => a.name))} q={q} />
          </span>
        ),
    },
    { key: "editions", label: "Editions", width: "12%", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
  ];
}

function authorColumns(q: string): Column<AuthorListRow>[] {
  return [
    {
      key: "name",
      label: "Author",
      render: (row) => (
        <Link href={`/author/${row.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
          <span>
            <Highlight text={row.name} q={q} />
          </span>
        </Link>
      ),
    },
    { key: "titles", label: "Titles", width: "110px", mono: true, align: "right", render: (row) => row.titles.toLocaleString("en-US") },
  ];
}

function publisherColumns(q: string): Column<PublisherWithLimited>[] {
  return [
    {
      key: "name",
      label: "Publisher",
      render: (row) => (
        <Link href={`/publishers-series/${row.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
          <span>
            <Highlight text={row.name} q={q} />
          </span>
        </Link>
      ),
    },
    { key: "editions", label: "Editions", width: "110px", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
  ];
}

const EDITION_COLUMNS: Column<EditionSearchRow>[] = [
  {
    key: "title",
    label: "Edition",
    sortKey: "title",
    width: "40%",
    render: (e) => (
      <div className="flex flex-col gap-0.5">
        {e.publisher && <span className={FIELD_LABEL}>{e.publisher.name}</span>}
        <Link href={`/edition/${e.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
          {e.title}
        </Link>
      </div>
    ),
  },
  { key: "year", label: "Year", sortKey: "year", width: "10%", mono: true },
  { key: "illustrators", label: "Illustrator", width: "22%", render: (e) => joinNames(e.illustrators) },
  {
    key: "binding",
    label: "Binding",
    width: "28%",
    render: (e) => e.binding && <span className="line-clamp-2 text-sm">{e.binding}</span>,
  },
];

const EDITION_SORTS = {
  title: (e: EditionSearchRow) => e.title,
  year: (e: EditionSearchRow) => e.year,
  publisher: (e: EditionSearchRow) => e.publisher?.name ?? null,
} as const;

function Section({ id, title, count, children }: { id: string; title: string; count: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-h`} className="m-0 text-[28px] leading-[34px]">
          {title}
        </h2>
        <span className="font-mono text-[13px] text-creme-gedempt">{count}</span>
      </div>
      {children}
    </section>
  );
}

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || null;
  const criteria = parseCriteria(params);
  const detailed = hasCriteria(criteria);
  const sort = (params.sort && params.sort in EDITION_SORTS ? params.sort : "title") as keyof typeof EDITION_SORTS;
  const dir: SortDir = params.dir === "desc" ? "desc" : "asc";

  const [titles, authors, publishers, index, options] = await Promise.all([
    getTitleList(),
    getAuthorList(),
    getPublisherList(),
    getEditionIndex(),
    getSearchOptions(),
  ]);

  // Quick search: everything that matches the term (the header's "Press Enter for all results")
  const titleHits = q
    ? sortBy(titles.filter((t) => matchesFilter([t.title, t.englishTitle, ...t.authors.map((a) => a.name)], q)), (t) => t.sortTitle, "asc")
    : [];
  const authorHits = q ? sortBy(authors.filter((a) => matchesFilter([a.name], q)), (a) => a.name, "asc") : [];
  const publisherHits = q ? publishers.filter((p) => matchesFilter([p.name], q)) : [];
  const quickTotal = titleHits.length + authorHits.length + publisherHits.length;
  const titlePage = paginate(titleHits, Number(params.tpage ?? 1), PAGE_SIZE);

  // Detailed search
  const editions = detailed ? sortBy(filterEditions(index, criteria), EDITION_SORTS[sort], dir) : [];
  const editionPage = paginate(editions, Number(params.page ?? 1), PAGE_SIZE);
  // The lists only offer choices that still give results with the other criteria
  const facets = {
    publisher: facetCounts(index, criteria, "publisher", new Map(options.publishers.map((p) => [String(p.id), p.name]))),
    series: facetCounts(index, criteria, "series", new Map(options.series.map((s) => [String(s.id), s.name]))),
    language: facetCounts(index, criteria, "language"),
  };

  const baseParams = { ...(q ? { q } : {}), ...criteriaParams(criteria) };
  const href = (changes: Record<string, string | null>, hash = "") => {
    const next = new URLSearchParams();
    const merged: Record<string, string | null> = {
      ...baseParams,
      sort: sort === "title" ? null : sort,
      dir: dir === "asc" ? null : dir,
      tpage: params.tpage ?? null,
      page: params.page ?? null,
      ...changes,
    };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return `/titles/search${qs ? `?${qs}` : ""}${hash}`;
  };

  return (
    <div className="flex flex-col gap-14">
      {q && (
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="m-0 text-4xl leading-none tracking-[-0.03em] sm:text-5xl sm:leading-[52px]">Search</h1>
            <span className="font-mono text-[13px] text-creme-gedempt">
              {plural(quickTotal, "result")} for “{q}”
            </span>
          </div>

          {quickTotal === 0 ? (
            <EmptyState
              title={`No results for “${q}”`}
              text="Check the spelling or try fewer words. Looking for a specific edition? Try the detailed search below."
              action={{ href: "#detailed", label: "Detailed search" }}
              secondary={{ href: "/titles", label: "Show all titles" }}
            />
          ) : (
            <>
              {titleHits.length > 0 && (
                <Section id="titles" title="Titles" count={plural(titleHits.length, "title")}>
                  <DataTable caption={`Titles matching ${q}`} columns={titleColumns(q)} rows={titlePage.rows} getRowKey={(r) => r.id} />
                  <Pagination
                    page={titlePage.page}
                    totalPages={titlePage.totalPages}
                    hrefFor={(p) => href({ tpage: String(p) }, "#titles")}
                  />
                </Section>
              )}
              {authorHits.length > 0 && (
                <Section id="authors" title="Authors" count={plural(authorHits.length, "author")}>
                  <DataTable caption={`Authors matching ${q}`} columns={authorColumns(q)} rows={authorHits.slice(0, PAGE_SIZE)} getRowKey={(r) => r.id} />
                </Section>
              )}
              {publisherHits.length > 0 && (
                <Section id="publishers" title="Publishers" count={plural(publisherHits.length, "publisher")}>
                  <DataTable caption={`Publishers matching ${q}`} columns={publisherColumns(q)} rows={publisherHits} getRowKey={(r) => r.id} />
                </Section>
              )}
            </>
          )}
        </div>
      )}

      <section id="detailed" aria-labelledby="detailed-h" className="flex scroll-mt-24 flex-col gap-6">
        {q ? (
          <h2 id="detailed-h" className="m-0 text-4xl leading-none tracking-[-0.03em] sm:text-5xl sm:leading-[52px]">
            Detailed search
          </h2>
        ) : (
          <h1 id="detailed-h" className="m-0 text-4xl leading-none tracking-[-0.03em] sm:text-5xl sm:leading-[52px]">
            Detailed search
          </h1>
        )}
        <DetailedSearchForm criteria={criteria} series={options.series} facets={facets} count={detailed ? editions.length : null} q={q} />
      </section>

      {detailed && (
        <Section id="results" title="Editions" count={plural(editions.length, "edition")}>
          {editions.length === 0 ? (
            <EmptyState
              title="No editions match these filters"
              text="Remove a filter to see more."
              filters={criteriaLabels(criteria, options)}
              action={{ href: q ? `/titles/search?q=${encodeURIComponent(q)}#detailed` : "/titles/search", label: "Clear all filters" }}
            />
          ) : (
            <>
              <DataTable
                caption="Editions matching the detailed search"
                columns={EDITION_COLUMNS}
                rows={editionPage.rows}
                getRowKey={(e) => e.id}
                sort={{
                  key: sort,
                  dir,
                  hrefFor: (key, nextDir) =>
                    href({ sort: key === "title" ? null : key, dir: nextDir === "asc" ? null : nextDir, page: null }, "#results"),
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[13px] text-creme-gedempt">
                  {editionPage.from.toLocaleString("en-US")} to {editionPage.to.toLocaleString("en-US")} of{" "}
                  {editionPage.total.toLocaleString("en-US")}
                </span>
                <Pagination
                  page={editionPage.page}
                  totalPages={editionPage.totalPages}
                  hrefFor={(p) => href({ page: String(p) }, "#results")}
                />
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  );
}
