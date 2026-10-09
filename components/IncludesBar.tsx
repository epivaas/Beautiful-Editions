import { IncludesChip } from "./Chip";

/** "Includes" bar with equal chips (Slipcase, Clamshell box, Dust jacket); nothing when the list is empty. */
export default function IncludesBar({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-center gap-4 rounded-card border border-lijn bg-oppervlak px-[18px] py-3.5">
      <span className="w-[76px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt">Includes</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <IncludesChip key={item}>{item}</IncludesChip>
        ))}
      </div>
    </div>
  );
}
