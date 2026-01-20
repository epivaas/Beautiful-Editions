"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AlphabetNav() {
  const searchParams = useSearchParams();
  const currentLetter = searchParams.get("letter");

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link
        href="/titles"
        className={`px-4 py-2 rounded border transition ${
          !currentLetter
            ? "bg-[#8b6f47] text-white border-[#8b6f47]"
            : "bg-white text-[#8b6f47] border-[#e0ddd0] hover:bg-[#fdfcf0]"
        }`}
      >
        All
      </Link>
      {letters.map((letter) => (
        <Link
          key={letter}
          href={`/titles?letter=${letter.toLowerCase()}`}
          className={`px-4 py-2 rounded border transition ${
            currentLetter === letter.toLowerCase()
              ? "bg-[#8b6f47] text-white border-[#8b6f47]"
              : "bg-white text-[#8b6f47] border-[#e0ddd0] hover:bg-[#fdfcf0]"
          }`}
        >
          {letter}
        </Link>
      ))}
    </div>
  );
}




