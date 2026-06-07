import { elanProxiedPath } from "./paths";

export type ElanProxyRewrite = { source: string; destination: string };

function normalizeElanOrigin(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

/**
 * Next.js rewrites for the parent app: same-origin `/elan/*` → Élan deployment `/elan/*`.
 *
 * Set on the parent: `ELAN_ORIGIN=https://elan.referenceprof.fr` (no trailing slash).
 *
 * In the parent’s `next.config.ts`:
 *
 * ```ts
 * import { elanProxyRewrites } from "@mariuslsr1/elan-parent-integration/rewrites";
 *
 * async rewrites() {
 *   return [...elanProxyRewrites()];
 * }
 * ```
 */
export function elanProxyRewrites(): ElanProxyRewrite[] {
  const elanOrigin = normalizeElanOrigin(process.env.ELAN_ORIGIN);
  if (!elanOrigin) {
    return [];
  }

  const prefix = elanProxiedPath("/").replace(/\/$/, "") || "/elan";

  /**
   * Élan serves `/elan` (200) but 308-redirects `/elan/` → `/elan`. Proxying to
   * `${prefix}/` makes the browser follow that redirect on the parent origin and loop.
   */
  const elanBase = `${elanOrigin}${prefix}`;

  return [
    { source: prefix, destination: elanBase },
    { source: `${prefix}/`, destination: elanBase },
    {
      source: `${prefix}/:path*`,
      destination: `${elanOrigin}${prefix}/:path*`,
    },
  ];
}
