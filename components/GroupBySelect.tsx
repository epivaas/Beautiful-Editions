"use client";

import { useRouter } from "next/navigation";

type GroupBySelectProps = {
  value: string;
  /** Choices with the link each one leads to. */
  options: { key: string; label: string; href: string }[];
};

/** "Group by" on the publisher page (board Overzichten): a choice applies at once. */
export default function GroupBySelect({ value, options }: GroupBySelectProps) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[13px] text-creme-gedempt">
      Group by
      <select
        value={value}
        onChange={(e) => {
          const option = options.find((o) => o.key === e.target.value);
          if (option) router.push(option.href, { scroll: false });
        }}
        className="h-11 rounded-ctl border border-creme bg-cocoa px-3.5 text-sm font-semibold text-creme focus:border-amber focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
