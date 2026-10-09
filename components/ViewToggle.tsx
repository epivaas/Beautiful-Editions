import Link from "next/link";

type ViewOption = { value: string; label: string; href: string; ariaLabel?: string };

type ViewToggleProps = {
  options: ViewOption[];
  current: string;
  label?: string;
};

/** Segmented switch (Cards / Grid, Sort by). Links, so the choice lives in the URL. */
export default function ViewToggle({ options, current, label = "View" }: ViewToggleProps) {
  return (
    <div role="group" aria-label={label} className="flex">
      {options.map((option, i) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={option.href}
            scroll={false}
            aria-current={active ? "true" : undefined}
            aria-label={option.ariaLabel}
            className={`flex min-h-11 items-center border border-creme px-[18px] text-sm font-semibold transition-colors ${
              i === 0 ? "rounded-l-ctl" : "-ml-px"
            } ${i === options.length - 1 ? "rounded-r-ctl" : ""} ${
              active ? "bg-creme text-inkt" : "text-creme hover:bg-creme/10"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
