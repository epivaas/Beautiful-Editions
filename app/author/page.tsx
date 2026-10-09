import type { Metadata } from "next";
import Link from "next/link";
import { getAuthorList, type AuthorListRow } from "@/app/lib/overviewQueries";
import {
  firstLetter,
  isLetterKey,
  letterCounts,
  matchesFilter,
  overviewHref,
  paginate,
  sortBy,
  type SortDir,
} from "@/app/lib/overview";
import ListBand from "@/components/ListBand";
import AlphabetBar from "@/components/AlphabetBar";
import ListFilter from "@/components/ListFilter";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import Highlight from "@/components/Highlight";
import Pagination from "@/components/Pagination";
import { TextLink } from "@/components/Button";

export const metadata: Metadata = { title: "Authors · Shelfhound" };

const PAGE_SIZE = 50;
const DEFAULTS = { sort: "name", dir: "asc" };

type SortKey = "name" | "titles" | "editions";
const SORT_VALUES: Record<SortKey, (row: AuthorListRow) => string | number> = {
  name: (row) => row.name,
  titles: (row) => row.titles,
  editions: (row) => row.editions,
};

type PageProps = {
  searchParams: Promise<{ letter?: string; q?: string; sort?: string; dir?: string; page?: string }>;
};

function columns(q: string | null): Column<AuthorListRow>[] {
  return [
  {
    key: "name",
    label: "Author",
    sortKey: "name",
    render: (row) => (
      <Link href={`/author/${row.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
        <span>
          <Highlight text={row.name} q={q} />
        </span>
      </Link>
    ),
  },
  { key: "titles", label: "Titles", sortKey: "titles", width: "110px", mono: true, align: "right", render: (row) => row.titles.toLocaleString("en-US") },
  { key: "editions", label: "Editions", sortKey: "editions", width: "110px", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
  ];
}

export default async function AuthorsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = query.q?.trim() || null;
  const sort: SortKey = query.sort && query.sort in SORT_VALUES ? (query.sort as SortKey) : "name";
  const dir: SortDir = query.dir === "desc" ? "desc" : "asc";

  const all = await getAuthorList();
  const filtered = all.filter((row) => matchesFilter([row.name], q));
  const counts = letterCounts(filtered, (row) => row.name);
  const letter = isLetterKey(query.letter) ? query.letter : null;
  const inLetter = letter ? filtered.filter((row) => firstLetter(row.name) === letter) : filtered;
  const page = paginate(sortBy(inLetter, SORT_VALUES[sort], dir), Number(query.page ?? 1), PAGE_SIZE);

  const state = { letter, q, sort, dir, page: String(page.page) };
  const href = (changes: Record<string, string | null>) => overviewHref("/author", state, changes, DEFAULTS);

  return (
    <div className="flex flex-col gap-5">
      <ListBand
        title="Authors"
        sentence="The people behind the works, from A to Z."
        count={all.length}
        label={["author", "authors"]}
      />
      <AlphabetBar active={letter} counts={counts} hrefFor={(l) => href({ letter: l })} />
      {/* A filter searches all authors, so it keeps only the sort order */}
      <ListFilter
        action="/author"
        q={q}
        keep={{ sort: sort === DEFAULTS.sort ? null : sort, dir: dir === DEFAULTS.dir ? null : dir }}
      />

      {page.total === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
          <p className="text-[22px] font-extrabold leading-7 tracking-[-0.02em]">No authors match</p>
          <p className="text-sm text-creme-gedempt">Check the spelling, try fewer words or another letter.</p>
          <TextLink href="/author" standalone className="text-sm">
            Clear filter
          </TextLink>
        </div>
      ) : (
        <>
          <DataTable
            caption="Authors"
            columns={columns(q)}
            rows={page.rows}
            getRowKey={(row) => row.id}
            sort={{ key: sort, dir, hrefFor: (key, nextDir) => href({ sort: key, dir: nextDir }) }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[13px] text-creme-gedempt">
              {page.from.toLocaleString("en-US")} to {page.to.toLocaleString("en-US")} of{" "}
              {page.total.toLocaleString("en-US")}
            </span>
            <Pagination page={page.page} totalPages={page.totalPages} hrefFor={(p) => href({ page: String(p) })} />
          </div>
        </>
      )}
    </div>
  );
}
