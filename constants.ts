/**
 * Path prefix on the **parent** site where Élan is reverse-proxied.
 * Must match Élan’s `NEXT_PUBLIC_BASE_PATH` (e.g. `/elan`).
 */
export const ELAN_PROXY_BASE_PATH = "/elan";

const DEFAULT_SITE_BRAND_ACCENT = "#E8620A";

/**
 * Brand accent passed to the Élan iframe (`?accent=`).
 * Set `NEXT_PUBLIC_SITE_BRAND_ACCENT` in `.env.local` (hex, e.g. `#E8620A`).
 */
export const SITE_BRAND_ACCENT =
  process.env.NEXT_PUBLIC_SITE_BRAND_ACCENT?.trim() || DEFAULT_SITE_BRAND_ACCENT;

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const elanButtonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const elanButtonVariant = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.97] focus-visible:ring-primary",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 active:scale-[0.97] focus-visible:ring-foreground/20",
  ghost:
    "bg-transparent text-foreground hover:bg-muted/60 active:scale-[0.97] focus-visible:ring-foreground/20",
} as const;

export type ElanButtonVariant = keyof typeof elanButtonVariant;

/** Tailwind classes for standalone embed UI buttons (no dependency on site `Button`). */
export function elanButtonClass(
  variant: ElanButtonVariant = "primary",
  className?: string,
) {
  return cn(elanButtonBase, elanButtonVariant[variant], className);
}
