# @mariuslsr1/elan-parent-integration

Next.js module for **parent sites** that embed [Élan](https://github.com/mariusLSR1/practicePlatform) via a same-origin reverse proxy at `/elan/*` (first-party Supabase cookies on the parent domain).

## Install

```bash
npm install github:mariusLSR1/elan-parent-integration
# or, after publishing:
# npm install @mariuslsr1/elan-parent-integration
```

In the parent `next.config.ts`, transpile the package (TypeScript source):

```ts
import type { NextConfig } from "next";
import { elanProxyRewrites } from "@mariuslsr1/elan-parent-integration/rewrites";

const nextConfig: NextConfig = {
  transpilePackages: ["@mariuslsr1/elan-parent-integration"],
  async rewrites() {
    return [...elanProxyRewrites()];
  },
};

export default nextConfig;
```

Merge with existing `rewrites` if needed: `return [...existing, ...elanProxyRewrites()]`.

## Environment (parent)

Copy `.env.example` to `.env.local`:

| Variable | Required | Role |
|----------|----------|------|
| `ELAN_ORIGIN` | Yes (prod) | Élan deployment origin for rewrites (no trailing slash) |
| `NEXT_PUBLIC_SITE_BRAND_ACCENT` | No | Default iframe accent (`#E8620A`) |

## Page setup

**Do not** add `app/elan/page.tsx` on the parent. App Router routes win over `afterFiles` rewrites and the proxy will not run. Use another path for your shell, e.g. `/espace-elan`:

```tsx
import { ElanEspaceShell } from "@mariuslsr1/elan-parent-integration/ElanEspaceShell";

export default function EspaceElanPage() {
  return (
    <>
      <YourSiteHeader />
      <main className="w-full">
        <ElanEspaceShell
          path="/"
          policyHref="/contact#mentions"
          wrapperClassName="w-full"
          iframeClassName="block w-full border-0"
        />
      </main>
    </>
  );
}
```

**Single scrollbar (parent page only):** `ElanIframe` defaults to `parentScroll` — the iframe grows with Élan content (`elan:resize`) and only the parent window scrolls. Do not use `absolute inset-0` or `h-full` on the iframe wrapper.

Or iframe only (no cookie banner):

```tsx
import { ElanIframe } from "@mariuslsr1/elan-parent-integration/ElanIframe";

export default function ElanPage() {
  return <ElanIframe path="/" />;
}
```

## Élan deployment

On the Élan app, configure:

- `NEXT_PUBLIC_BASE_PATH=/elan` (must match `ELAN_PROXY_BASE_PATH` in this package, default `/elan`)
- `ELAN_ALLOWED_PROXY_ORIGINS` — each parent hostname
- Supabase redirect URLs: `https://<parent>/elan/auth/recovery`, etc.

See the [parent reverse-proxy guide](https://github.com/mariusLSR1/practicePlatform/blob/main/docs/parent-reverse-proxy.md) in the Élan repo.

## Custom proxy prefix

Change `ELAN_PROXY_BASE_PATH` in `constants.ts` only if Élan uses a different `NEXT_PUBLIC_BASE_PATH` (fork or patch; prefer keeping `/elan`).

## Local demo (static parent page)

```bash
# Terminal 1 — Élan app
NEXT_PUBLIC_BASE_PATH=/elan npm run dev

# Terminal 2 — this package
npm run dev:demo
```

Open `http://localhost:4000/`. Allow `http://localhost:4000` in Élan `ELAN_FRAME_ANCESTORS`.

## API

Main exports from `@mariuslsr1/elan-parent-integration`:

- `elanProxyRewrites`, `elanProxiedPath`
- `ElanIframe`, `ElanEspaceShell`, `ElanCookieConsent`
- `getParentEmbedSnapshot`, `setParentEmbedSnapshot`, `clearParentEmbedSnapshot`
- `getEmbedConsent`, `setEmbedConsent`, `clearEmbedConsent`

## Development

```bash
npm install
npm run typecheck
npm test
```

## License

MIT
