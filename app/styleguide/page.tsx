import type { Metadata } from "next";
import { Logo, Wordmark } from "@/components/Logo";
import HeaderSearch from "@/components/HeaderSearch";

export const metadata: Metadata = {
  title: "Styleguide · Shelfhound",
  robots: { index: false },
};

// Swatch classes are written out in full so Tailwind picks them up.
const COLORS = [
  { name: "cocoa", swatch: "bg-cocoa", use: "Page background" },
  { name: "oppervlak", swatch: "bg-oppervlak", use: "Cards, panels" },
  { name: "lijn", swatch: "bg-lijn", use: "Borders" },
  { name: "kop", swatch: "bg-kop", use: "Header, table head" },
  { name: "mat", swatch: "bg-mat", use: "Photo mat" },
  { name: "rij-hover", swatch: "bg-rij-hover", use: "Table row hover" },
  { name: "creme", swatch: "bg-creme", use: "Body text" },
  { name: "creme-gedempt", swatch: "bg-creme-gedempt", use: "Secondary text" },
  { name: "leeg", swatch: "bg-leeg", use: "Empty “—”, disabled" },
  { name: "inkt", swatch: "bg-inkt", use: "Text on Amber, Gloed, mat" },
  { name: "amber", swatch: "bg-amber", use: "Clickable, selected, yellow band" },
  { name: "gloed", swatch: "bg-gloed", use: "Counts, variant labels (no small text)" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[13px] uppercase tracking-[0.08em] text-amber">{children}</div>;
}

export default function StyleguidePage() {
  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-4">
        <Eyebrow>Shelfhound · Styleguide</Eyebrow>
        <h1 className="text-5xl leading-none tracking-[-0.03em] sm:text-[72px] sm:leading-[72px]">Styleguide</h1>
        <p className="max-w-[68ch] text-[17px] leading-[27px] text-creme-gedempt">
          Tokens and shared components. Grows with every new component.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <Eyebrow>Colours</Eyebrow>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {COLORS.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-card border border-lijn bg-oppervlak">
              <div className={`h-20 ${c.swatch}`} />
              <div className="flex flex-col gap-1 p-3">
                <span className="font-mono text-sm">{c.name}</span>
                <span className="text-[13px] text-creme-gedempt">{c.use}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Type</Eyebrow>
        <div className="flex flex-col gap-6">
          <div className="text-[72px] font-extrabold leading-[72px] tracking-[-0.03em]">Page title 72</div>
          <h2 className="text-[32px] leading-9">Heading 2 · 32/36</h2>
          <h3 className="text-[26px] leading-8">Heading 3 · 26/32</h3>
          <p className="max-w-[68ch] text-base">
            Body text, Archivo 400 at 16 px. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p className="max-w-[68ch] text-[17px] leading-[27px]">
            Note 17/27 in a column of at most 68 characters, used for longer descriptions of an edition.
          </p>
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-creme-gedempt">Field label</div>
          <Eyebrow>Eyebrow · mono 13</Eyebrow>
          <div className="font-mono text-base">1947 · 26 · No. 14/250</div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Logo</Eyebrow>
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <Wordmark size={22} />
          </div>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <Wordmark size={16} />
          </div>
          <Logo size={16} />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Header search</Eyebrow>
        <div className="w-full max-w-[300px]">
          <HeaderSearch />
        </div>
      </section>
    </div>
  );
}
