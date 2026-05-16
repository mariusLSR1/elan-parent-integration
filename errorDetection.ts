/** Visible text markers for proxied Élan pages that failed to load correctly. */
export const ELAN_ERROR_MARKERS = [
  "internal server error",
  "erreur interne du serveur",
  "500 internal server error",
  "502 bad gateway",
  "503 service unavailable",
  "504 gateway timeout",
  "bad gateway",
  "service unavailable",
  "application error:",
  "a client-side exception has occurred",
  "see the browser console for more information",
  "unhandled runtime error",
] as const;

/** Shown in the document title or main heading on real error/404 pages. */
const ELAN_ERROR_TITLE_MARKERS = [
  ...ELAN_ERROR_MARKERS,
  "page introuvable",
  "page not found",
  "this page could not be found",
] as const;

function normalizeSnippet(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function snippetContainsMarker(snippet: string, markers: readonly string[]): boolean {
  const normalized = normalizeSnippet(snippet);
  return markers.some((marker) => normalized.includes(marker));
}

function extractHtmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

/** Pre-fetch check: HTTP status and document title only (not RSC/script payloads). */
export function shouldRejectProxiedResponse(status: number, html: string): boolean {
  if (status >= 400) {
    return true;
  }
  const title = extractHtmlTitle(html);
  return title ? snippetContainsMarker(title, ELAN_ERROR_TITLE_MARKERS) : false;
}

export function hasErrorDomSignals(doc: Document): boolean {
  if (doc.querySelector("#__next_error__") || doc.querySelector("[data-nextjs-error]")) {
    return true;
  }

  const dialog = doc.querySelector("[data-nextjs-dialog]");
  if (dialog && snippetContainsMarker(dialog.textContent ?? "", ELAN_ERROR_MARKERS)) {
    return true;
  }

  return false;
}

/** Post-load check: visible iframe text and Next.js error UI only. */
export function isErrorPageDocument(doc: Document): boolean {
  if (hasErrorDomSignals(doc)) {
    return true;
  }

  const title = doc.title ?? "";
  if (snippetContainsMarker(title, ELAN_ERROR_TITLE_MARKERS)) {
    return true;
  }

  const heading = doc.querySelector("h1, h2")?.textContent ?? "";
  if (snippetContainsMarker(heading, ELAN_ERROR_TITLE_MARKERS)) {
    return true;
  }

  const snippet = normalizeSnippet(doc.body?.innerText ?? "");
  if (!snippet) {
    return false;
  }

  return snippetContainsMarker(snippet, ELAN_ERROR_MARKERS);
}
