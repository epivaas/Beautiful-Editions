import PhotoTile from "./PhotoTile";

type PrintingFact = { label: string; value: string | null };

export type PrintingTableRow = {
  id: number;
  name: string;
  year: number | null;
  copies: number | null;
  differences: string | null;
  description: string;
  facts: PrintingFact[];
  photos: { id: number; src: string; alt: string; credit: string | null }[];
  expandable: boolean;
};

const COLS = "grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 sm:grid-cols-[28px_minmax(0,1.5fr)_70px_90px_minmax(0,3fr)_70px]";
const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt";

function Empty() {
  return <span className="text-leeg">—</span>;
}

function RowCells({ row, marker }: { row: PrintingTableRow; marker: React.ReactNode }) {
  const phoneMeta = [row.year, row.copies ? `${row.copies.toLocaleString("en-US")} copies` : null, row.photos.length ? `${row.photos.length} photos` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <span aria-hidden="true" className="flex items-center justify-center text-xs text-amber">
        {marker}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 py-3">
        <span className="line-clamp-2 text-[15px] font-bold text-creme">{row.name}</span>
        {/* Phone: the other columns collapse into one line under the name */}
        {phoneMeta && <span className="font-mono text-[13px] text-creme-gedempt sm:hidden">{phoneMeta}</span>}
        {row.differences && <span className="line-clamp-2 text-sm text-creme-gedempt sm:hidden">{row.differences}</span>}
      </span>
      <span className="hidden self-center font-mono text-[13px] sm:block">{row.year ?? <Empty />}</span>
      <span className="hidden self-center text-right font-mono text-[13px] sm:block">
        {row.copies ? row.copies.toLocaleString("en-US") : <Empty />}
      </span>
      <span className="hidden self-center text-sm text-creme-gedempt sm:line-clamp-2">
        {row.differences ?? <span className="text-leeg">No differences recorded</span>}
      </span>
      <span className="hidden self-center text-right font-mono text-[13px] sm:block">
        {row.photos.length || <Empty />}
      </span>
    </>
  );
}

/**
 * Printings (non-limited sub-editions). Rows with extra facts or photos unfold with ▶ (a native
 * <details>, so it works without JavaScript and with the keyboard); other rows say everything in the row.
 */
export default function PrintingsTable({ rows }: { rows: PrintingTableRow[] }) {
  return (
    // The header is hidden on phones, so there the first row needs no top rule of its own
    <div className="overflow-hidden rounded-card border border-lijn bg-oppervlak [&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(2)]:border-t">
      <div className={`${COLS} hidden bg-kop px-5 py-2.5 sm:grid ${FIELD_LABEL}`} aria-hidden="true">
        <span />
        <span>Printing</span>
        <span>Year</span>
        <span className="text-right">Copies</span>
        <span>Differences</span>
        <span className="text-right">Photos</span>
      </div>

      {rows.map((row) =>
        row.expandable ? (
          <details key={row.id} className="group border-t border-lijn open:bg-rij-hover">
            <summary
              className={`${COLS} min-h-12 cursor-pointer list-none items-center px-5 hover:bg-rij-hover [&::-webkit-details-marker]:hidden`}
            >
              <RowCells row={row} marker={<span className="inline-block transition-transform group-open:rotate-90">▶</span>} />
            </summary>
            <div className="flex flex-wrap gap-7 border-t border-lijn px-5 pb-[22px] pt-[18px] sm:pl-[62px]">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
                {row.facts.length > 0 && (
                  <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3 md:grid-cols-3">
                    {row.facts.map((fact) => (
                      <div key={fact.label} className="min-w-0">
                        <dt className={FIELD_LABEL}>{fact.label}</dt>
                        <dd className="m-0 mt-[3px] break-words text-sm">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {/* Full text when it differs from the row, or when the row cuts it off (two lines) */}
                {(row.description !== row.name || row.description.length > 70) && (
                  <p className="m-0 text-sm leading-[21px] text-creme-gedempt">{row.description}</p>
                )}
              </div>
              {row.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {row.photos.slice(0, 4).map((photo) => (
                    <PhotoTile key={photo.id} src={photo.src} alt={photo.alt} credit={photo.credit} padding={5} className="h-[100px] w-[120px]" />
                  ))}
                </div>
              )}
            </div>
          </details>
        ) : (
          <div key={row.id} className={`${COLS} min-h-12 items-center border-t border-lijn px-5`}>
            <RowCells row={row} marker={null} />
          </div>
        )
      )}
    </div>
  );
}
