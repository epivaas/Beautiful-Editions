"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KINDS, type Kind } from "@/app/lib/suggestions";
import SuggestDialog from "./SuggestDialog";

// Pages with their own way in (About) or none (the queue)
const HIDDEN_ON = ["/about", "/admin"];

/** The button alone, e.g. on the About page. */
export function SuggestButton({ kind, label = "Suggest a change" }: { kind?: Kind; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-ctl border border-creme px-5 text-[15px] font-semibold text-creme transition-colors hover:bg-creme/10"
      >
        {label}
      </button>
      {open && <SuggestDialog onClose={close} initialKind={kind} />}
    </>
  );
}

/**
 * The fixed line at the bottom of every page (board Opmerkingen, step 1). `?suggest=photograph` (or any
 * kind) opens the form at once, e.g. from "Send a photograph" on a title without photos.
 */
export default function SuggestChange() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const asked = params.get("suggest");
  const askedKind = KINDS.find((k) => k.key === asked)?.key;
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    if (asked) {
      const next = new URLSearchParams(params.toString());
      next.delete("suggest");
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [asked, params, pathname, router]);

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <section aria-label="Suggest a change" className="container mx-auto w-full max-w-7xl px-4 pb-10">
      <div className="flex flex-col items-start gap-4 rounded-card border border-lijn bg-oppervlak px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="m-0 text-[17px] font-bold">Something wrong or missing on this page?</p>
          <p className="m-0 text-sm text-creme-gedempt">Suggest a correction, add a note or send a photograph.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-ctl border border-creme px-5 text-[15px] font-semibold text-creme transition-colors hover:bg-creme/10"
        >
          Suggest a change
        </button>
      </div>
      {(open || askedKind) && <SuggestDialog onClose={close} initialKind={askedKind} />}
    </section>
  );
}
