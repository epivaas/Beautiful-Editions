"use client";

import { useEffect } from "react";
import { Button, TextLink } from "@/components/Button";

/**
 * Error (500) (board About en randgevallen): smaller than a full page, with a Gloed edge. Gloed is only a
 * line here, never text: on Cocoa it stays under 4.5:1.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex justify-center py-10">
      <div role="alert" className="flex w-full max-w-[640px] flex-col items-start gap-3 rounded-card border-2 border-gloed bg-oppervlak p-6 md:p-8">
        <h1 className="m-0 text-[28px] leading-[34px]">Something went wrong on our side</h1>
        <p className="m-0 text-[15px] text-creme-gedempt">
          This is not your fault. Try again in a few minutes. If it keeps failing, let us know.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {/* retry() fetches and renders the segment again (Next 16; reset() would not re-fetch) */}
          <Button onClick={() => retry()}>Try again</Button>
          <TextLink href="/about#suggest" standalone className="text-sm">
            Let us know
          </TextLink>
        </div>
        {error.digest && <p className="m-0 font-mono text-xs text-creme-gedempt">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
