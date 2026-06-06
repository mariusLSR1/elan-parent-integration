import { elanProxiedPath } from "./paths";

const EMBED_STORAGE_KEYS = ["elan_embed_v1", "elan_session_visible_v1"] as const;

/** Élan mock iframe entry (`/embed/mock?as=…`). */
export function isDemoEmbedPath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/embed/mock" || normalized.startsWith("/embed/mock?");
}

/**
 * Clears mock/demo session cookies on the parent origin (proxied `/api/embed/exit-mock`).
 * Safe to call when leaving a demo embed or before loading the real espace iframe.
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

function blankIframeElement(iframe: HTMLIFrameElement): void {
  try {
    iframe.src = "about:blank";
  } catch {
    /* ignore */
  }
}

/** Stop network activity, drop mock embed storage, and release the iframe document. */
export function teardownEmbedIframe(iframe: HTMLIFrameElement | null | undefined): void {
  if (!iframe) return;
  clearEmbedStorageInWindow(iframe.contentWindow);
  blankIframeElement(iframe);
}
