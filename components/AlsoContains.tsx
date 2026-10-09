import Link from "next/link";

type AlsoContainsProps = {
  titles: { id: number; title: string }[];
  /** How many titles to name before "+N". */
  max?: number;
};

/** "Also contains" line on an edition card whose edition holds several titles (DESIGN.md §6 Titelpagina). */
export default function AlsoContains({ titles, max = 3 }: AlsoContainsProps) {
  if (titles.length === 0) return null;
  const shown = titles.slice(0, max);
  const more = titles.length - shown.length;

  return (
    // relative z-10: stays clickable above the stretched card link of the grid card
    <div className="relative z-10 text-sm leading-5 text-creme-gedempt">
      <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.09em]">Also contains</span>
      {shown.map((t, i) => (
        <span key={t.id}>
          {i > 0 && ", "}
          <Link href={`/titles/${t.id}`} className="font-semibold text-amber hover:underline">
            {t.title}
          </Link>
        </span>
      ))}
      {more > 0 && <span className="font-mono text-[13px]"> +{more}</span>}
    </div>
  );
}
