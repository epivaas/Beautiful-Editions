import Link from "next/link";

export default function Home() {
  return (
    <div className="py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif text-[#8b6f47] mb-4">
          Beautiful Editions
        </h1>
        <p className="text-xl text-[#6b6b6b] max-w-2xl mx-auto">
          A curated collection of fine book editions from prestigious publishers
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link
          href="/publishers-series"
          className="block p-8 bg-white border border-[#e0ddd0] rounded bibliophilic-shadow bibliophilic-hover"
        >
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-3">
            Publishers & Series
          </h2>
          <p className="text-[#6b6b6b]">
            Browse our collection of fine editions organized by publisher and series
          </p>
        </Link>

        <Link
          href="/titles"
          className="block p-8 bg-white border border-[#e0ddd0] rounded bibliophilic-shadow bibliophilic-hover"
        >
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-3">
            Titles
          </h2>
          <p className="text-[#6b6b6b]">
            Explore titles by author, search our library, or browse alphabetically
          </p>
        </Link>
      </div>
    </div>
  );
}
