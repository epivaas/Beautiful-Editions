import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorPage } from "@/app/lib/authorPageQuery";
import { authorCounts, authorTitleRows, titlesPerPublisher, type AuthorTitleRow } from "@/app/lib/authorPage";
import { firstLetter, LETTERS, matchesFilter, overviewHref, paginate, plural } from "@/app/lib/overview";
import { joinNames } from "@/app/lib/names";
import YellowBand from "@/components/YellowBand";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import ListFilter from "@/components/ListFilter";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import Highlight from "@/components/Highlight";
import { TextLink } from "@/components/Button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

// Filter and pagination only for long lists (board Auteur en reeks: "vanaf ongeveer 25 titels")
const FILTER_FROM = 25;
const PAGE_SIZE = 50;

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const page = id ? await getAuthorPage(id) : null;
  return { title: page ? `${page.author.name.trim()} · Shelfhound` : "Author not found · Shelfhound" };
}

function columns(q: string | null): Column<AuthorTitleRow>[] {
  return [
    {
      key: "title",
      label: "Title",
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
      key: "firstPublished",
      label: "First published",
      width: "15%",
      render: (row) => row.firstPublished && <span className="font-mono text-sm">{row.firstPublished}</span>,
    },
    { key: "editions", label: "Editions", width: "11%", mono: true, align: "right", render: (row) => row.editions.toLocaleString("en-US") },
    {
      key: "publishers",
      label: "Publishers",
      width: "20%",
      render: (row) => row.publishers.length > 0 && <span className="text-sm">{joinNames(row.publishers.map((p) => p.name))}</span>,
    },
  ];
}

/** Author page (board Auteur en reeks, DESIGN.md §6): a band with the number of titles and one table. */
export default async function AuthorPage({ params, searchParams }: PageProps) {
  const id = parseId((await params).id);
  const data = id ? await getAuthorPage(id) : null;
  if (!data) notFound();
  const query = await searchParams;

  const name = data.author.name.trim();
  const rows = authorTitleRows(data.works, data.links);
  const counts = authorCounts(rows, data.links);
  const perPublisher = titlesPerPublisher(rows);
  const most = perPublisher[0]?.titles ?? 1;

  const long = rows.length >= FILTER_FROM;
  const q = long ? query.q?.trim() || null : null;
  const filtered = q ? rows.filter((r) => matchesFilter([r.title, r.englishTitle], q)) : rows;
  const page = paginate(filtered, long ? Number(query.page ?? 1) : 1, long ? PAGE_SIZE : Math.max(filtered.length, 1));
  const base = `/author/${data.author.id}`;
  const href = (changes: Record<string, string | null>) => overviewHref(base, { q, page: String(page.page) }, changes, { page: "1" });

  const letterKey = firstLetter(name);
  const letter = LETTERS.find((l) => l.key === letterKey);
  const lines = [
    counts.publishers > 0 && plural(counts.publishers, "publisher"),
    counts.editions > 0 && plural(counts.editions, "edition"),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/author" standalone>
            Authors
          </TextLink>
          {letter && (
            <>
              <span aria-hidden="true">/</span>
              <TextLink href={`/author?letter=${letter.key}`} standalone aria-label={`Authors starting with ${letter.name}`}>
                {letter.label}
              </TextLink>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-creme">
            {name}
          </span>
        </nav>

        <YellowBand
          title={name}
          size="lg"
          count={{
            value: counts.titles,
            label: counts.titles === 1 ? "title" : "titles",
            note: lines.length > 0 ? lines.join(" · ") : null,
          }}
        >
          {data.author.wiki_link && (
            <div className="text-base leading-6">
              <a
                href={data.author.wiki_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-bold underline underline-offset-[3px] hover:no-underline sm:min-h-0"
              >
                Wikipedia ↗
              </a>
            </div>
          )}
        </YellowBand>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          text="There are no titles by this author in the database yet. An empty list can also mean the data is still being added."
          secondary={{ href: "/author", label: "← Back to authors" }}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="titles" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titles" className="text-[26px] leading-8">
                Titles
              </h2>
              <span className="font-mono text-[13px] text-creme-gedempt">
                {q ? `${filtered.length} of ${plural(rows.length, "title")}` : plural(rows.length, "title")}
              </span>
            </div>
            {long && <ListFilter action={base} q={q} />}
            {filtered.length === 0 ? (
              <EmptyState title="No titles match" text="Check the spelling or try fewer words." secondary={{ href: base, label: "Clear filter" }} />
            ) : (
              <>
                <DataTable caption={`Titles by ${name}`} columns={columns(q)} rows={page.rows} getRowKey={(r) => r.id} />
                {page.totalPages > 1 && (
                  <Pagination page={page.page} totalPages={page.totalPages} hrefFor={(p) => href({ page: String(p) })} />
                )}
              </>
            )}
          </section>

          {perPublisher.length > 0 && (
            <section aria-labelledby="per-publisher" className="flex flex-col gap-4">
              <h2 id="per-publisher" className="text-[26px] leading-8">
                Titles per publisher
              </h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {perPublisher.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <Link
                      href={`/publishers/${p.id}`}
                      className="inline-flex min-h-11 w-[150px] shrink-0 items-center text-sm text-amber hover:underline sm:min-h-8"
                    >
                      {p.name}
                    </Link>
                    <div className="h-3.5 flex-1 overflow-hidden rounded-[2px] bg-oppervlak" aria-hidden="true">
                      <div className="h-full bg-amber" style={{ width: `${(p.titles / most) * 100}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right font-mono text-[13px] text-creme-gedempt">
                      <span className="sr-only">{plural(p.titles, "title")}</span>
                      <span aria-hidden="true">{p.titles}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
