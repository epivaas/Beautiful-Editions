"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Wordmark } from "./Logo";
import HeaderSearch from "./HeaderSearch";
import { NAV, isActive } from "./nav";

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState<"menu" | "search" | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(null);
  const toggle = (panel: "menu" | "search") => setOpen((cur) => (cur === panel ? null : panel));

  return (
    <header className="sticky top-0 z-50 border-b border-lijn bg-kop">
      <div className="flex items-center gap-3 px-4 py-1.5 sm:gap-5 sm:px-7 sm:py-3.5 lg:gap-7">
        <Link href="/" onClick={close} className="flex min-h-11 items-center gap-2.5" aria-label="Shelfhound, home">
          <Logo size={34} />
          <Wordmark size={22} />
        </Link>

        {/* Desktop menu */}
        <nav aria-label="Main" className="hidden gap-5.5 text-sm sm:flex">
          {NAV.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center border-b-[3px] pt-[3px] font-semibold transition-colors ${
                  active
                    ? "border-amber text-creme"
                    : "border-transparent text-creme-gedempt hover:text-creme"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="ml-auto hidden w-[300px] lg:flex" />

        {/* Narrow screens: search button below 1024 px, menu button below 640 px */}
        <div className="ml-auto flex lg:hidden">
          <button
            type="button"
            onClick={() => toggle("search")}
            aria-expanded={open === "search"}
            aria-controls="header-search-panel"
            aria-label="Search"
            className="flex size-11 items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="stroke-creme">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => toggle("menu")}
            aria-expanded={open === "menu"}
            aria-controls="header-menu-panel"
            aria-label="Menu"
            className="flex size-11 items-center justify-center sm:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="stroke-creme">
              {open === "menu" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open === "search" && (
        <div id="header-search-panel" className="border-t border-lijn px-4 py-3 sm:px-7 lg:hidden">
          <HeaderSearch autoFocus className="w-full" />
        </div>
      )}

      {open === "menu" && (
        <nav id="header-menu-panel" aria-label="Main" className="flex flex-col border-t border-lijn bg-cocoa px-4 py-3.5 sm:hidden">
          {NAV.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center border-b border-lijn text-lg font-bold ${
                  active ? "text-amber" : "text-creme"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
