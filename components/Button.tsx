import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Primary: Amber surface. Secondary: Crème outline. At most one primary button per block.
const VARIANTS = {
  primary: "border-amber bg-amber font-bold text-inkt hover:bg-amber/90",
  secondary: "border-creme bg-transparent font-semibold text-creme hover:bg-creme/10",
} as const;

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ctl border px-5 text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type Variant = keyof typeof VARIANTS;

type ButtonProps = { variant?: Variant; className?: string; children: ReactNode } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & Omit<ComponentProps<"button">, "className">)
);

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (rest.href !== undefined) {
    return (
      <Link {...rest} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as ComponentProps<"button">;
  return (
    <button type={type} {...buttonProps} className={classes}>
      {children}
    </button>
  );
}

type TextLinkProps = ComponentProps<typeof Link> & {
  /** A loose action such as "Clear all" (not a link inside a sentence): 44 px tap target on phones. */
  standalone?: boolean;
};

export function TextLink({ className = "", standalone = false, ...props }: TextLinkProps) {
  const size = standalone ? "inline-flex min-h-11 items-center sm:min-h-0" : "";
  return <Link {...props} className={`font-semibold text-amber hover:underline ${size} ${className}`} />;
}
