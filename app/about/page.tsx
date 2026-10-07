import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · Shelfhound",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-card bg-amber px-8 py-10 text-inkt">
        <h1 className="text-5xl leading-none tracking-[-0.03em] sm:text-6xl">About</h1>
        <p className="mt-5 text-xl font-semibold">A reference for beautifully illustrated editions</p>
        <p className="mt-1 text-lg">Find the edition worth owning</p>
      </section>
      <p className="text-creme-gedempt">This page is coming soon.</p>
    </div>
  );
}
