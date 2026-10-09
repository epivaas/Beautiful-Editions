// Shelfhound mark: a dog whose face is an open book, on an Amber tile.
// Paths from docs/design/boards; colours via token classes only.

type LogoProps = {
  size?: number;
  /**
   * "inverted" for use on Amber: a Cocoa tile with Cocoa details (DESIGN.md §4, logo/…-omgekeerd.svg).
   * "ink" for use on Gloed (the 404 page): an Inkt tile with Amber details.
   */
  variant?: "default" | "inverted" | "ink";
  className?: string;
};

export function Logo({ size = 34, variant = "default", className = "" }: LogoProps) {
  // Tile radius scales with size (DESIGN.md §4): 8/64 in the header, 14/64 from 64 px up.
  const tileRadius = size >= 64 ? 14 : 8;
  const { tile, detail, detailStroke, snoutStroke } = {
    default: { tile: "fill-amber", detail: "fill-inkt", detailStroke: "stroke-inkt", snoutStroke: "stroke-amber" },
    inverted: { tile: "fill-cocoa", detail: "fill-cocoa", detailStroke: "stroke-cocoa", snoutStroke: "stroke-cocoa" },
    ink: { tile: "fill-inkt", detail: "fill-amber", detailStroke: "stroke-amber", snoutStroke: "stroke-inkt" },
  }[variant];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
    >
      <rect width="64" height="64" rx={tileRadius} className={tile} />
      <path d="M10 14 C3 17 2 40 4 56 C4.5 59 12 59 13.5 56 L13 20Z" className="fill-gloed" />
      <path d="M54 14 C61 17 62 40 60 56 C59.5 59 52 59 50.5 56 L51 20Z" className="fill-gloed" />
      <path d="M9 13 C20 8 28 12 31 18 L31 42 C24 37 15 37 9 41Z" className="fill-creme" />
      <path d="M55 13 C44 8 36 12 33 18 L33 42 C40 37 49 37 55 41Z" className="fill-creme" />
      <circle cx="21" cy="22" r="2.7" className={detail} />
      <circle cx="43" cy="22" r="2.7" className={detail} />
      <rect x="23" y="32" width="18" height="21" rx="9" strokeWidth="2.4" className={`fill-creme ${snoutStroke}`} />
      <ellipse cx="32" cy="38" rx="4.2" ry="3" className={detail} />
      <path d="M32 41 L32 46" strokeWidth="1.8" strokeLinecap="round" className={detailStroke} />
      <path
        d="M27.5 47 C29 49 31 49 32 46 C33 49 35 49 36.5 47"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        className={detailStroke}
      />
    </svg>
  );
}

type WordmarkProps = {
  /** Font size in px; line height follows at ~1.1. */
  size?: number;
  className?: string;
};

export function Wordmark({ size = 22, className = "" }: WordmarkProps) {
  return (
    <span
      className={`whitespace-nowrap font-sans font-extrabold tracking-[-0.04em] ${className}`}
      style={{ fontSize: size, lineHeight: `${Math.round(size * 1.1)}px` }}
    >
      <span className="text-creme">Shelf</span>
      <span className="text-amber">hound</span>
    </span>
  );
}
