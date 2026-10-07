"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type HeaderSearchProps = {
  className?: string;
  autoFocus?: boolean;
};

export default function HeaderSearch({ className = "", autoFocus = false }: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const typing = query.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/titles/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`flex h-10 items-center gap-2.5 rounded-ctl px-3 text-sm transition-colors ${
        typing ? "border-2 border-amber bg-oppervlak" : "border border-lijn bg-cocoa"
      } focus-within:border-amber ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={`shrink-0 ${typing ? "stroke-creme" : "stroke-creme-gedempt"}`}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search titles, authors and publishers"
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-creme placeholder:text-creme-gedempt focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <Link href="/titles/search" className="shrink-0 text-xs font-semibold text-amber hover:underline">
        Detailed
      </Link>
    </form>
  );
}
