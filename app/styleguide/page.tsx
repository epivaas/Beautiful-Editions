import type { Metadata } from "next";
import { Logo, Wordmark } from "@/components/Logo";
import HeaderSearch from "@/components/HeaderSearch";
import { Button, TextLink } from "@/components/Button";
import { ActiveFilter, FilterChip, IncludesChip, VariantLabel } from "@/components/Chip";
import PhotoTile from "@/components/PhotoTile";
import EditionCard from "@/components/EditionCard";
import YellowBand from "@/components/YellowBand";
import FactGrid from "@/components/FactGrid";
import NoteText from "@/components/NoteText";
import DataTable, { type Column } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import { supabase } from "@/utils/supabase";
import { getPhotoUrl } from "@/app/lib/editionUtils";

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

// Real photos only: the guide forbids placeholder or palette-coloured images.
export const revalidate = 3600;

type SamplePhoto = { src: string; credit: string | null; alt: string };

async function getSamplePhotos(): Promise<SamplePhoto[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, caption, copyright_statement")
    .not("copyright_statement", "is", null)
    .order("id", { ascending: true })
    .limit(3);

  if (error || !data) {
    console.error("Styleguide: error fetching sample photos:", error);
    return [];
  }

  return data.map((p) => ({
    src: getPhotoUrl(p.storage_path),
    credit: p.copyright_statement,
    alt: p.caption || "Sample photograph",
  }));
}

type SampleTitle = { id: number; title: string; original: string | null; first: string | null; editions: number; publishers: string | null };

const SAMPLE_TITLES: SampleTitle[] = [
  { id: 1, title: "The Iliad", original: "Iliás", first: "c. 8th c. BC", editions: 5, publishers: "Folio Society, Suntup" },
  { id: 2, title: "The Odyssey", original: "Odýsseia", first: "c. 8th c. BC", editions: 6, publishers: "Folio Society, Suntup, Curious King Books" },
  { id: 3, title: "Heart of Darkness", original: null, first: "1899", editions: 5, publishers: "" },
];

const TITLE_COLUMNS: Column<SampleTitle>[] = [
  { key: "title", label: "Title", width: "26%", render: (r) => <TextLink href="#">{r.title}</TextLink> },
  { key: "original", label: "Original title", width: "20%" },
  { key: "first", label: "First published", width: "16%", mono: true },
  { key: "editions", label: "Editions", width: "10%", mono: true, align: "right" },
  { key: "publishers", label: "Publishers" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[13px] uppercase tracking-[0.08em] text-amber">{children}</div>;
}

export default async function StyleguidePage() {
  const photos = await getSamplePhotos();
  const [first, second, third] = photos;

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
          <div className="max-w-[760px]">
            <NoteText
              texts={[
                "Note 17/27 in a column of at most 760 px, used for longer descriptions of an edition. After ten lines it is cut off with “Show full note”.",
                ...Array.from({ length: 4 }, () =>
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
                ),
              ]}
            />
          </div>
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
        <Eyebrow>Buttons and links</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <Button href="#">View edition</Button>
          <Button variant="secondary">Source</Button>
          <Button disabled>Disabled</Button>
          <TextLink href="#">Text link</TextLink>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Chips and labels</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <FilterChip count={4}>Folio Society</FilterChip>
          <FilterChip count={3} selected>Suntup Editions</FilterChip>
          <FilterChip count={0} disabled>Curious King Books</FilterChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActiveFilter removeHref="#">Suntup Editions</ActiveFilter>
          <ActiveFilter removeHref="#">1990–2010</ActiveFilter>
          <TextLink href="#" standalone className="text-sm">Clear all</TextLink>
        </div>
        <div className="flex flex-wrap gap-2">
          <IncludesChip>Slipcase</IncludesChip>
          <IncludesChip>Dust jacket</IncludesChip>
          <IncludesChip>Clamshell box</IncludesChip>
          <VariantLabel>Edition of 26</VariantLabel>
          <VariantLabel>Numbered 250</VariantLabel>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Photo tiles</Eyebrow>
        <div className="flex flex-wrap gap-6">
          <PhotoTile src={first?.src} alt={first?.alt ?? ""} credit={first?.credit} padding={16} className="h-[340px] w-[260px] max-w-full" />
          <PhotoTile src={second?.src} alt={second?.alt ?? ""} credit={null} padding={16} className="h-[340px] w-[260px] max-w-full" />
          <PhotoTile alt="" padding={16} className="h-[340px] w-[260px] max-w-full" />
        </div>
        <p className="text-[13px] text-creme-gedempt">With credit, without credit (no © button), no photograph.</p>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Edition cards</Eyebrow>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EditionCard
            href="#"
            title="The Odyssey"
            publisher="Suntup Editions"
            year={2018}
            binding="Full leather"
            variants={["Lettered 26", "Numbered 250"]}
            photo={first ? { src: first.src, credit: first.credit } : null}
          />
          <EditionCard
            href="#"
            title="Heart of Darkness"
            publisher="Folio Society"
            year={1997}
            photo={third ? { src: third.src, credit: third.credit } : null}
          />
          <EditionCard href="#" title="Aucassin and Nicolette" publisher="Folio Society" binding="Quarter cloth" />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Yellow band</Eyebrow>
        <YellowBand
          as="h2"
          publisher="Suntup Editions"
          title="The Odyssey"
          subtitle="Lettered edition"
          subtitleNote="2018"
          meta="by Homer · illustrated by Illustrator D"
          count={{ label: "Edition of", value: 26, note: "Lettered A–Z", labelPosition: "above" }}
        />
        <YellowBand as="h2" size="lg" title="Homer" meta="Greek · c. 8th century BC · Wikipedia" />
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Facts grid (variant page: compared with the edition)</Eyebrow>
        <FactGrid
          items={[
            { label: "Copies", value: "Edition of 26" },
            { label: "Binding", value: "Full leather", note: "Edition: Cloth" },
            { label: "Pages", value: "Pp. [1–9] 10–388", note: "Same as edition", mono: true },
            { label: "ISBN", value: null, mono: true },
          ]}
        />
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Table</Eyebrow>
        <DataTable caption="Titles by Homer" columns={TITLE_COLUMNS} rows={SAMPLE_TITLES} getRowKey={(r) => r.id} />
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>Pagination</Eyebrow>
        <Pagination page={1} totalPages={20} hrefFor={(p) => `?page=${p}`} />
        <Pagination page={7} totalPages={20} hrefFor={(p) => `?page=${p}`} />
        <Pagination page={20} totalPages={20} hrefFor={(p) => `?page=${p}`} />
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
