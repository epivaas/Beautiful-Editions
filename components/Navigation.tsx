"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PublishersSeriesMenu from "./PublishersSeriesMenu";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#e0ddd0] bg-[#f9f8f0] sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-serif text-[#8b6f47] hover:text-[#6b5230] transition">
            Beautiful Editions
          </Link>
          
          <div className="flex items-center gap-8">
            {/* Publishers and Series Dropdown */}
            <PublishersSeriesMenu />

            {/* Separator */}
            <span className="text-[#e0ddd0]">|</span>

            {/* Titles Link */}
            <Link
              href="/titles"
              className={`${
                pathname === "/titles" || pathname?.startsWith("/titles/") ? "text-[#8b6f47]" : "text-[#1a1a1a]"
              } hover:text-[#8b6f47] transition font-medium px-3 py-1 rounded hover:bg-[#fdfcf0]`}
            >
              Titles
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

