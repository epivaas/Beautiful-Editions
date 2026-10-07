export type PageItem = number | "ellipsis";

/**
 * Page numbers to show around the current page: always the first and last page,
 * `siblings` pages on each side of the current one, and "ellipsis" for gaps.
 * A gap of a single page shows that page instead of an ellipsis.
 */
export function getPageItems(page: number, total: number, siblings = 1): PageItem[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const current = Math.min(Math.max(page, 1), total);
  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const items: PageItem[] = [1];

  if (start > 3) items.push("ellipsis");
  else for (let p = 2; p < start; p++) items.push(p);

  for (let p = start; p <= end; p++) items.push(p);

  if (end < total - 2) items.push("ellipsis");
  else for (let p = end + 1; p < total; p++) items.push(p);

  items.push(total);
  return items;
}
