import type { Metadata } from "next";
import Link from "next/link";
import { getTitleList, type TitleListRow } from "@/app/lib/overviewQueries";
import { NAME_SEPARATOR } from "@/app/lib/names";
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

export const metadata: Metadata = { title: "Titles · Shelfhound" };

const PAGE_SIZE = 50;
const DEFAULTS = { sort: "title", dir: "asc" };

type SortKey = "title" | "author" | "year" | "editions";
const SORT_VALUES: Record<SortKey, (row: TitleListRow) => string | number | null> = {
  // sort_title leaves out leading articles (The, Les, Die)
  title: (row) => row.sortTitle,
  author: (row) => row.authors[0]?.name ?? null,
  year: (row) => row.firstPublishedSort,
  editions: (row) => row.editions,
};

type PageProps = {
  searchParams: Promise<{ letter?: string; q?: string; sort?: string; dir?: string; page?: string }>;
};

function columns(q: string | null): Column<TitleListRow>[] {
  return [
  {
    key: "title",
    label: "Title",
    sortKey: "title",
    width: "30%",
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
    width: "24%",
    render: (row) =>
      row.englishTitle && (
        <span className="text-sm text-creme-gedempt">
          <Highlight text={row.englishTitle} q={q} />
        </span>
      ),
  },
  {
    key: "author",
    label: "Author",
    sortKey: "author",
    width: "22%",
    render: (row) =>
      row.authors.length > 0 && (
        <span className="text-sm">
          {row.authors.map((a, i) => (
            // The separator sticks to the name before it, so it never ends up on a line of its own
            <span key={a.id} className="mr-1 inline-flex items-center">
              <Link href={`/author/${a.id}`} className={`${CELL_LINK} text-amber hover:underline`}>
                <Highlight text={a.name} q={q} />
              </Link>
              {i < row.authors.length - 1 && NAME_SEPARATOR.trim()}
            </span>
          ))}
        </span>
      ),
  },
  { key: "firstPublished", label: "First published", sortKey: "year", width: "14%", mono: true },
  { key: "editions", label: "Editions", sortKey: "editions", width: "10%", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
  ];
}

export default async function TitlesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = query.q?.trim() || null;
  const sort: SortKey = query.sort && query.sort in SORT_VALUES ? (query.sort as SortKey) : "title";
  const dir: SortDir = query.dir === "desc" ? "desc" : "asc";

  const all = await getTitleList();
  const filtered = all.filter((row) =>
    matchesFilter([row.title, row.englishTitle, ...row.authors.map((a) => a.name)], q)
  );
  const counts = letterCounts(filtered, (row) => row.sortTitle);
  const letter = isLetterKey(query.letter) ? query.letter : null;
  const inLetter = letter ? filtered.filter((row) => firstLetter(row.sortTitle) === letter) : filtered;
  const page = paginate(sortBy(inLetter, SORT_VALUES[sort], dir), Number(query.page ?? 1), PAGE_SIZE);

  const state = { letter, q, sort, dir, page: String(page.page) };
  const href = (changes: Record<string, string | null>) => overviewHref("/titles", state, changes, DEFAULTS);

  return (
    <div className="flex flex-col gap-5">
      <ListBand
        title="Titles"
        sentence="Every work on the shelf, under its original title."
        count={all.length}
        label={["title", "titles"]}
      />
      <AlphabetBar active={letter} counts={counts} hrefFor={(l) => href({ letter: l })} />
      {/* A filter searches all titles, so it keeps only the sort order */}
      <ListFilter
        action="/titles"
        q={q}
        keep={{ sort: sort === DEFAULTS.sort ? null : sort, dir: dir === DEFAULTS.dir ? null : dir }}
      />

      {page.total === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
          <p className="text-[22px] font-extrabold leading-7 tracking-[-0.02em]">No titles match</p>
          <p className="text-sm text-creme-gedempt">Check the spelling, try fewer words or another letter.</p>
          <TextLink href="/titles" standalone className="text-sm">
            Clear filter
          </TextLink>
        </div>
      ) : (
        <>
          <DataTable
            caption="Titles"
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
