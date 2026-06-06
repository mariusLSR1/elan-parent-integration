import { elanProxiedPath } from "./paths";

/** Élan mock iframe entry (`/embed/mock?as=…`). */
export function isDemoEmbedPath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/embed/mock" || normalized.startsWith("/embed/mock?");
}

/**
 * Clears Élan mock-session cookies on the parent origin (proxied `/elan/embed/mock?clear=1`).
 * Safe to call when leaving a demo embed or before loading the real espace iframe.
 */
export async function clearEmbedMockSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch(elanProxiedPath("/embed/mock?clear=1"), {
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
    });
  } catch {
    /* network / proxy unavailable */
  }
}

function blankIframeElement(iframe: HTMLIFrameElement): void {
  try {
    iframe.src = "about:blank";
  } catch {
    /* ignore */
  }
}

/** Stop network activity and release the iframe document on unmount. */
export function teardownEmbedIframe(iframe: HTMLIFrameElement | null | undefined): void {
  if (!iframe) return;
  blankIframeElement(iframe);
}
