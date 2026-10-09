"use client";

import { useEffect, useId, useRef, useState } from "react";

// 10 lines of 27 px (DESIGN.md: nota 17/27)
const CLAMP_HEIGHT = "max-h-[270px]";

/**
 * Editorial note on edition and variant pages: 17/27 paragraphs, cut off after ten lines with
 * "Show full note". The button only appears when the text is really longer.
 */
export default function NoteText({ texts }: { texts: string[] }) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const expandedRef = useRef(expanded);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Measured while cut off only; a different width can change the number of lines
    const observer = new ResizeObserver(() => {
      if (!expandedRef.current) setOverflowing(el.scrollHeight > el.clientHeight + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div id={id} ref={box} className={`flex flex-col gap-3.5 ${expanded ? "" : `${CLAMP_HEIGHT} overflow-hidden`}`}>
        {texts.map((text, i) => (
          <p key={i} className="m-0 whitespace-pre-line text-[17px] leading-[27px]">
            {text}
          </p>
        ))}
      </div>
      {overflowing && (
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex min-h-11 items-center text-[15px] font-semibold text-amber hover:underline"
          >
            {expanded ? "Show less" : "Show full note"}
          </button>
        </div>
      )}
    </div>
  );
}
