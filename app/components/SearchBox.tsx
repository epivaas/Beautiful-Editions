"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/titles/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search titles or authors..."
        className="flex-1 px-4 py-2 border border-[#e0ddd0] rounded focus:outline-none focus:ring-2 focus:ring-[#8b6f47] focus:border-transparent"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-[#8b6f47] text-white rounded hover:bg-[#6b5a3a] transition"
      >
        Search
      </button>
    </form>
  );
}