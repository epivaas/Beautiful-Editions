import Link from "next/link";

type TitleChip = { id: number; title: string; current: boolean };

const VISIBLE = 5;
const CHIP =
  "inline-flex min-h-11 items-center rounded-ctl border-[1.5px] border-inkt px-3 text-sm font-semibold sm:min-h-8";

function Chip({ chip }: { chip: TitleChip }) {
  return (
    <Link
      href={`/titles/${chip.id}`}
      aria-current={chip.current ? "page" : undefined}
      className={`${CHIP} ${chip.current ? "bg-inkt text-amber" : "text-inkt hover:bg-inkt/10"}`}
    >
      {chip.title}
    </Link>
  );
}

/** "Contains" row in the yellow band of an edition with several titles (DESIGN.md §6 Editiepagina). */
export default function TitleChips({ titles }: { titles: TitleChip[] }) {
  const shown = titles.slice(0, VISIBLE);
  const rest = titles.slice(VISIBLE);

  return (
    <div className="mt-2 flex items-start gap-3.5">
      <span className="flex min-h-11 shrink-0 items-center font-mono text-[13px] uppercase tracking-[0.08em] sm:min-h-8">
        Contains
      </span>
      <div className="flex flex-wrap gap-2">
        {shown.map((chip) => (
          <Chip key={chip.id} chip={chip} />
        ))}
        {rest.length > 0 && (
          // No JavaScript needed: the remaining titles unfold in place
          <details className="group open:basis-full">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-bold underline underline-offset-[3px] sm:min-h-8 group-open:hidden [&::-webkit-details-marker]:hidden">
              +{rest.length} more
            </summary>
            <div className="flex flex-wrap gap-2">
              {rest.map((chip) => (
                <Chip key={chip.id} chip={chip} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
