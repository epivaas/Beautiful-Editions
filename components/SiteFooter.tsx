import Link from "next/link";
import { Logo, Wordmark } from "./Logo";
import { NAV } from "./nav";

const BROWSE = NAV.filter((item) => item.label !== "About");

// FAQ and Suggest a change land on anchors of the About page until their own pages exist.
const SHELFHOUND = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/about#faq" },
  { label: "Suggest a change", href: "/about#suggest", accent: true },
];

const LINK = "flex min-h-11 items-center sm:min-h-0";

export default function SiteFooter() {
  return (
    <footer className="border-t border-lijn bg-kop">
      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8 px-4 py-8 sm:px-7">
        <div className="flex flex-col gap-2.5">
          <Link href="/" className="flex min-h-11 items-center gap-2.5" aria-label="Shelfhound, home">
            <Logo size={24} />
            <Wordmark size={20} />
          </Link>
          <div className="text-[13px] text-creme-gedempt">Published by Dust BV</div>
        </div>

        <div className="flex gap-14 text-sm text-creme-gedempt">
          <nav aria-label="Browse" className="flex flex-col sm:gap-2">
            <span className="font-semibold text-creme">Browse</span>
            {BROWSE.map((item) => (
              <Link key={item.label} href={item.href} className={`${LINK} hover:text-creme`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Shelfhound" className="flex flex-col sm:gap-2">
            <span className="font-semibold text-creme">Shelfhound</span>
            {SHELFHOUND.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${LINK} ${item.accent ? "font-semibold text-amber hover:underline" : "hover:text-creme"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
