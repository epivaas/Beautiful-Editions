import Link from "next/link";
import type { ReactNode } from "react";
import { NAME_SEPARATOR } from "@/app/lib/names";

type EditionCreditsProps = {
  authors: { id: number; name: string }[];
  translators: string[];
  illustrators: string[];
};

const INLINE_LINK = "underline underline-offset-[3px] hover:no-underline";

/** "Doré, Gustave; Rackham, Arthur": names are "Last, First", so people are separated by a semicolon */
export function joinNames(names: ReactNode[]) {
  return names.map((name, i) => (
    <span key={i}>
      {i > 0 && NAME_SEPARATOR}
      {name}
    </span>
  ));
}

/** "by … · translated by … · illustrated by …" in the yellow band of edition and variant pages. */
export default function EditionCredits({ authors, translators, illustrators }: EditionCreditsProps) {
  const parts = [
    authors.length > 0 && (
      <span key="by">
        by{" "}
        {joinNames(
          authors.map((a) => (
            <Link key={a.id} href={`/author/${a.id}`} className={INLINE_LINK}>
              {a.name}
            </Link>
          ))
        )}
      </span>
    ),
    translators.length > 0 && <span key="tr">translated by {joinNames(translators)}</span>,
    illustrators.length > 0 && <span key="il">illustrated by {joinNames(illustrators)}</span>,
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <div className="text-base leading-6">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {part}
        </span>
      ))}
    </div>
  );
}
