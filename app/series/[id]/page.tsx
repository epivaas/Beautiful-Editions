import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesPage } from "@/app/lib/seriesPageQuery";
import { seriesRows, type SeriesRow } from "@/app/lib/seriesPage";
import { plural, yearSpan } from "@/app/lib/overview";
import { joinNames } from "@/app/lib/names";
import YellowBand from "@/components/YellowBand";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import NoteText from "@/components/NoteText";
import { IncludesChip } from "@/components/Chip";
import { TextLink } from "@/components/Button";

type PageProps = { params: Promise<{ id: string }> };

// Longer series names get the smaller title size in the band
const LONG_NAME = 32;

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  const page = id ? await getSeriesPage(id) : null;
  return { title: page ? `${page.series.name.trim()} · Shelfhound` : "Series not found · Shelfhound" };
}

const COLUMNS: Column<SeriesRow>[] = [
  {
    key: "title",
    label: "Title",
    width: "42%",
    render: (row) => (
      <Link href={`/edition/${row.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-bold`}>
        {row.title}
      </Link>
    ),
  },
  { key: "authors", label: "Author", render: (row) => row.authors.length > 0 && <span className="text-sm">{joinNames(row.authors)}</span> },
  {
    key: "year",
    label: "Published",
    width: "170px",
    render: (row) =>
      row.year !== null && (
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm">{row.year}</span>
          {row.announced && <IncludesChip size="sm">Announced</IncludesChip>}
        </span>
      ),
  },
];

/**
 * Series page (board Auteur en reeks, DESIGN.md §6): one publisher, the volumes in order of publication
 * with their number in front, announced volumes at the bottom. No filter or sorting: a series is short.
 */
export default async function SeriesPage({ params }: PageProps) {
  const id = parseId((await params).id);
  const data = id ? await getSeriesPage(id) : null;
  if (!data) notFound();

  const { series } = data;
  const name = series.name.trim();
  const publisherName = series.publisher?.name.trim() || null;
  const rows = seriesRows(data.editions, new Date().getFullYear(), name);
  const announced = rows.filter((r) => r.announced).length;
  const span = yearSpan(rows.map((r) => r.year));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
          <TextLink href="/series" standalone>
            Series
          </TextLink>
          {series.publisher && (
            <>
              <span aria-hidden="true">/</span>
              <TextLink href={`/publishers-series/${series.publisher.id}`} standalone>
                {publisherName}
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
          size={name.length > LONG_NAME ? "md" : "list"}
          publisher={publisherName}
          count={{
            value: rows.length,
            label: rows.length === 1 ? "title" : "titles",
            note: announced > 0 ? `${announced} still to come` : null,
          }}
        >
          <div className="text-xl font-medium leading-7 md:text-[22px] md:leading-[30px]">
            {["Series", span].filter(Boolean).join(" · ")}
          </div>
        </YellowBand>
      </div>

      {series.description?.trim() && (
        <section aria-labelledby="about" className="flex max-w-[640px] flex-col gap-3">
          <h2 id="about" className="text-[26px] leading-8">
            About this series
          </h2>
          <NoteText texts={[series.description.trim()]} />
        </section>
      )}

      <section aria-labelledby="volumes" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="volumes" className="text-[26px] leading-8">
            Titles in this series
          </h2>
          <span className="font-mono text-[13px] text-creme-gedempt">{plural(rows.length, "title")}</span>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-lijn p-6">
            <p className="m-0 text-[22px] font-extrabold leading-7 tracking-[-0.02em]">No titles yet</p>
            <p className="m-0 text-sm text-creme-gedempt">There are no editions in this series on Shelfhound yet.</p>
          </div>
        ) : (
          <>
            <DataTable caption={`Titles in ${name}`} columns={COLUMNS} rows={rows} getRowKey={(r) => r.id} />
            <p className="m-0 text-[13px] leading-[19px] text-creme-gedempt">
              In order of publication. Titles still to come are at the bottom, marked Announced.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
