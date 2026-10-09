import type { Metadata } from "next";
import Link from "next/link";
import { getSeriesList, type SeriesListRow } from "@/app/lib/overviewQueries";
import { matchesFilter, overviewHref, sortBy, type SortDir } from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import ListFilter from "@/components/ListFilter";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import Highlight from "@/components/Highlight";
import { TextLink } from "@/components/Button";

export const metadata: Metadata = { title: "Series · Shelfhound" };

const DEFAULTS = { sort: "name", dir: "asc" };

type SortKey = "name" | "publisher" | "titles" | "years";
const SORT_VALUES: Record<SortKey, (row: SeriesListRow) => string | number | null> = {
  name: (row) => row.name,
  publisher: (row) => row.publisher?.name ?? null,
  titles: (row) => row.titles,
  years: (row) => row.firstYear,
};

type PageProps = { searchParams: Promise<{ q?: string; sort?: string; dir?: string }> };

function columns(q: string | null): Column<SeriesListRow>[] {
  return [
  {
    key: "name",
    label: "Series",
    sortKey: "name",
    render: (row) => (
      <Link
        href={`/series/${row.id}`}
        className={`${CELL_LINK} ${ROW_TITLE} py-1 text-xl font-extrabold leading-[26px] tracking-[-0.02em]`}
      >
        <span>
          <Highlight text={row.name} q={q} />
        </span>
      </Link>
    ),
  },
  {
    key: "publisher",
    label: "Publisher",
    sortKey: "publisher",
    width: "26%",
    render: (row) =>
      row.publisher && (
        <Link href={`/publishers-series/${row.publisher.id}`} className={`${CELL_LINK} text-sm text-amber hover:underline`}>
          <Highlight text={row.publisher.name} q={q} />
        </Link>
      ),
  },
  { key: "titles", label: "Titles", sortKey: "titles", width: "110px", mono: true, align: "right", render: (row) => row.titles.toLocaleString("en-US") },
  {
    key: "years",
    label: "Years",
    sortKey: "years",
    width: "170px",
    render: (row) => row.years && <span className="font-mono text-sm text-creme-gedempt">{row.years}</span>,
  },
  ];
}

export default async function SeriesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = query.q?.trim() || null;
  const sort: SortKey = query.sort && query.sort in SORT_VALUES ? (query.sort as SortKey) : "name";
  const dir: SortDir = query.dir === "desc" ? "desc" : "asc";

  const all = await getSeriesList();
  const rows = sortBy(
    all.filter((row) => matchesFilter([row.name, row.publisher?.name], q)),
    SORT_VALUES[sort],
    dir
  );
  const state = { q, sort, dir };
  const href = (changes: Record<string, string | null>) => overviewHref("/series", state, changes, DEFAULTS);

  return (
    <div className="flex flex-col gap-6">
      <ListBand
        title="Series"
        sentence="Publisher series, in order of publication."
        count={all.length}
        label={["series", "series"]}
      />
      <ListFilter
        action="/series"
        q={q}
        keep={{ sort: sort === DEFAULTS.sort ? null : sort, dir: dir === DEFAULTS.dir ? null : dir }}
      />
      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
          <p className="text-[22px] font-extrabold leading-7 tracking-[-0.02em]">No series match</p>
          <p className="text-sm text-creme-gedempt">Check the spelling or try fewer words.</p>
          <TextLink href="/series" standalone className="text-sm">
            Clear filter
          </TextLink>
        </div>
      ) : (
        <DataTable
          caption="Series"
          columns={columns(q)}
          rows={rows}
          getRowKey={(row) => row.id}
          sort={{ key: sort, dir, hrefFor: (key, nextDir) => href({ sort: key, dir: nextDir }) }}
        />
      )}
    </div>
  );
}
