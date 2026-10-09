import type { ReactNode } from "react";
import { Button, TextLink } from "./Button";

type Action = { href: string; label: string };

type EmptyStateProps = {
  title: string;
  text?: ReactNode;
  /** Active filters shown as chips, e.g. "2008" and "Full leather". */
  filters?: string[];
  /** The one Amber button (DESIGN.md §6: at most one per empty state). */
  action?: Action;
  /** A quieter second step: an outlined button, or a text link when there is no primary action. */
  secondary?: Action;
};

/**
 * Empty state (board About en randgevallen): says what is going on, gives a reason or a next step
 * and has at most one Amber button.
 */
export default function EmptyState({ title, text, filters = [], action, secondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-lijn bg-cocoa p-6">
      <p className="m-0 text-[22px] font-extrabold leading-7 tracking-[-0.02em]">{title}</p>
      {text && <p className="m-0 max-w-[68ch] text-sm text-creme-gedempt">{text}</p>}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <span key={f} className="inline-flex min-h-7 items-center rounded-ctl bg-lijn px-[11px] text-[13px] font-semibold">
              {f}
            </span>
          ))}
        </div>
      )}
      {(action || secondary) && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {action && <Button href={action.href}>{action.label}</Button>}
          {secondary &&
            (action ? (
              <Button href={secondary.href} variant="secondary">
                {secondary.label}
              </Button>
            ) : (
              <TextLink href={secondary.href} standalone className="text-sm">
                {secondary.label}
              </TextLink>
            ))}
        </div>
      )}
    </div>
  );
}
