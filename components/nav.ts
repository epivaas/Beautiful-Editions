export type NavItem = {
  label: string;
  href: string;
  /** Path prefixes that mark this item as active in the header. */
  match: string[];
};

export const NAV: NavItem[] = [
  { label: "Titles", href: "/titles", match: ["/titles", "/edition", "/sub-editions"] },
  { label: "Authors", href: "/author", match: ["/author"] },
  { label: "Publishers", href: "/publishers", match: ["/publishers"] },
  { label: "Series", href: "/series", match: ["/series"] },
  { label: "About", href: "/about", match: ["/about"] },
];

export function isActive(item: NavItem, pathname: string) {
  return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
