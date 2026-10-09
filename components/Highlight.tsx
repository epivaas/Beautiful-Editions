import { highlightParts } from "@/app/lib/overview";

/** Text with the characters that match the list filter marked: a Gloed surface with Inkt text. */
export default function Highlight({ text, q }: { text: string; q: string | null | undefined }) {
  const parts = highlightParts(text, q);
  if (parts.length === 1 && !parts[0].match) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-[3px] bg-gloed px-px text-inkt">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
