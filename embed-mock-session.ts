import { elanProxiedPath } from "./paths";

const EMBED_STORAGE_KEYS = ["elan_embed_v1", "elan_session_visible_v1"] as const;

/** Élan mock iframe entry (`/embed/mock?as=…`). */
export function isDemoEmbedPath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/embed/mock" || normalized.startsWith("/embed/mock?");
}

/**
 * Clears mock/demo session cookies on the parent origin (proxied `/api/embed/exit-mock`).
 * Call before loading the real espace iframe — not when unmounting the demo iframe.
 */
export async function clearEmbedMockSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch(elanProxiedPath("/api/embed/exit-mock"), {
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    /* network / proxy unavailable */
  }
}

function clearEmbedStorageInWindow(win: Window | null | undefined): void {
  if (!win) return;
  try {
    for (const key of EMBED_STORAGE_KEYS) {
      if (key === "elan_session_visible_v1") {
        win.sessionStorage.removeItem(key);
      } else {
        win.localStorage.removeItem(key);
      }
    }
  } catch {
    /* detached / blocked */
  }
}

/**
 * Best-effort cleanup of embed storage inside a same-origin iframe.
 * Does not navigate to `about:blank` — that leaves a visible empty document when React
 * keeps the iframe mounted (Strict Mode remounts, fast route changes).
 */
export function clearEmbedIframeStorage(iframe: HTMLIFrameElement | null | undefined): void {
  if (!iframe) return;
  clearEmbedStorageInWindow(iframe.contentWindow);
}

/** @deprecated Use {@link clearEmbedIframeStorage}. Never sets `about:blank`. */
export function teardownEmbedIframe(iframe: HTMLIFrameElement | null | undefined): void {
  clearEmbedIframeStorage(iframe);
}
