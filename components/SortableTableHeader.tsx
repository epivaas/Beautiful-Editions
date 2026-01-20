import Link from "next/link";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: string;
  baseUrl: string;
  params: Record<string, string | undefined>;
}

export default function SortableTableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  baseUrl,
  params,
}: SortableTableHeaderProps) {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
  
  const createUrl = () => {
    const newParams = new URLSearchParams();
    
    // Keep existing params
    if (params.letter) newParams.set("letter", params.letter);
    if (params.q) newParams.set("q", params.q);
    
    // Set sort params
    newParams.set("sort", sortKey);
    newParams.set("order", nextOrder);
    
    return `${baseUrl}?${newParams.toString()}`;
  };

  return (
    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
      <Link
        href={createUrl()}
        className="flex items-center gap-2 hover:text-[#6b5230] transition"
      >
        {label}
        <span className="text-xs">
          {isActive ? (currentOrder === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </Link>
    </th>
  );
}

