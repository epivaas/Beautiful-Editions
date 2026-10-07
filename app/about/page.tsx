import type { Metadata } from "next";
import YellowBand from "@/components/YellowBand";

export const metadata: Metadata = {
  title: "About · Shelfhound",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10">
      <YellowBand
        size="md"
        title="About"
        subtitle="A reference for beautifully illustrated editions"
        meta="Find the edition worth owning"
      />
      <p className="text-creme-gedempt">This page is coming soon.</p>

      {/* Anchors for the footer links; filled in when FAQ and suggestions are built */}
      <section id="faq" className="scroll-mt-24">
        <h2 className="text-[32px] leading-9">FAQ</h2>
        <p className="mt-2 text-creme-gedempt">Coming soon.</p>
      </section>
      <section id="suggest" className="scroll-mt-24">
        <h2 className="text-[32px] leading-9">Suggest a change</h2>
        <p className="mt-2 text-creme-gedempt">Coming soon.</p>
      </section>
    </div>
  );
}
