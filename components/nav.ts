export type NavItem = {
  label: string;
  href: string;
  /** Path prefixes that mark this item as active in the header. */
  match: string[];
};

// Publisher and series detail pages still live under /publishers-series until they are restyled.
export const NAV: NavItem[] = [
  { label: "Titles", href: "/titles", match: ["/titles", "/edition", "/sub-editions"] },
  { label: "Authors", href: "/author", match: ["/author"] },
  { label: "Publishers", href: "/publishers", match: ["/publishers", "/publishers-series"] },
  { label: "Series", href: "/series", match: ["/series"] },
  { label: "About", href: "/about", match: ["/about"] },
];

export function isActive(item: NavItem, pathname: string) {
  return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
