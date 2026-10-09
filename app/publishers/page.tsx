import type { Metadata } from "next";
import Link from "next/link";
import { getPublisherList, type PublisherListRow } from "@/app/lib/overviewQueries";
import { overviewHref, sortBy, type SortDir } from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import DataTable, { ROW_TITLE, type Column } from "@/components/DataTable";

export const metadata: Metadata = { title: "Publishers · Shelfhound" };

const DEFAULTS = { sort: "name", dir: "asc" };

type SortKey = "name" | "titles" | "editions" | "active";
const SORT_VALUES: Record<SortKey, (row: PublisherListRow) => string | number | null> = {
  name: (row) => row.name,
  titles: (row) => row.titles,
  editions: (row) => row.editions,
  active: (row) => row.firstYear,
};

type PageProps = { searchParams: Promise<{ sort?: string; dir?: string }> };

// A short list without details: roomy rows, the name large (board Overzichten)
const COLUMNS: Column<PublisherListRow>[] = [
  {
    key: "name",
    label: "Publisher",
    sortKey: "name",
    render: (row) => (
      <Link
        href={`/publishers-series/${row.id}`}
        className={`${ROW_TITLE} block py-2 text-2xl font-extrabold leading-7 tracking-[-0.02em]`}
      >
        {row.name}
      </Link>
    ),
  },
  { key: "titles", label: "Titles", sortKey: "titles", width: "110px", mono: true, align: "right", render: (row) => row.titles.toLocaleString("en-US") },
  { key: "editions", label: "Editions", sortKey: "editions", width: "110px", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
  {
    key: "years",
    label: "Active",
    sortKey: "active",
    width: "170px",
    render: (row) => row.years && <span className="font-mono text-sm text-creme-gedempt">{row.years}</span>,
  },
];

export default async function PublishersPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const sort: SortKey = query.sort && query.sort in SORT_VALUES ? (query.sort as SortKey) : "name";
  const dir: SortDir = query.dir === "desc" ? "desc" : "asc";

  const all = await getPublisherList();
  const rows = sortBy(all, SORT_VALUES[sort], dir);
  const state = { sort, dir };

  return (
    <div className="flex flex-col gap-6">
      <ListBand
        title="Publishers"
        sentence="The houses that publish the editions."
        count={all.length}
        label={["publisher", "publishers"]}
      />
      <DataTable
        caption="Publishers"
        columns={COLUMNS}
        rows={rows}
        getRowKey={(row) => row.id}
        sort={{
          key: sort,
          dir,
          hrefFor: (key, nextDir) => overviewHref("/publishers", state, { sort: key, dir: nextDir }, DEFAULTS),
        }}
      />
    </div>
  );
}
