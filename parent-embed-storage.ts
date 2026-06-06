/**
 * Persist Élan iframe hints on the **parent** site (first-party cookies + localStorage fallback).
 * Updated when the iframe posts `elan:embed-state` (see {@link ElanIframe}).
 */

import { hasEmbedStorageConsent } from "./cookie-consent";

const COOKIE_NAME = "elan_embed_v1";
const STORAGE_KEY = "elan_embed_v1";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

export type ParentEmbedSnapshot = {
  landingPath?: "/prof" | "/eleve" | "/admin";
  role?: "professor" | "student" | "admin";
  accent?: string;
  sessionActive?: boolean;
  updatedAt: number;
};

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function readCookie(): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function writeCookie(payload: string): void {
  if (!isBrowser()) return;
  const encoded = encodeURIComponent(payload);
  document.cookie = `${COOKIE_NAME}=${encoded}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
}

function parseSnapshot(raw: string | null): ParentEmbedSnapshot | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ParentEmbedSnapshot;
    if (!data || typeof data.updatedAt !== "number") return null;
    if (Date.now() - data.updatedAt > MAX_AGE_SEC * 1000) {
      clearParentEmbedSnapshot();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Read snapshot from cookie, then localStorage. */
export function getParentEmbedSnapshot(): ParentEmbedSnapshot | null {
  if (!isBrowser() || !hasEmbedStorageConsent()) return null;
  const fromCookie = parseSnapshot(readCookie());
  if (fromCookie) return fromCookie;
  try {
    return parseSnapshot(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Merge and persist on the parent origin (cookie + localStorage mirror). */
export function setParentEmbedSnapshot(
  patch: Partial<Omit<ParentEmbedSnapshot, "updatedAt">>,
): ParentEmbedSnapshot {
  const prev = getParentEmbedSnapshot();
  const next: ParentEmbedSnapshot = {
    ...prev,
    ...patch,
    updatedAt: Date.now(),
  };
  const raw = JSON.stringify(next);
  if (hasEmbedStorageConsent()) {
    writeCookie(raw);
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      /* quota / private mode */
    }
  }
  return next;
}

export function clearParentEmbedSnapshot(): void {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const ACCENT_HEX = /^#([0-9a-fA-F]{6})$/;

export function normalizeAccent(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const v = value.trim();
  return ACCENT_HEX.test(v) ? v : undefined;
}

/** Parent `initialAccent` wins over values reported by the iframe into cookies. */
export function resolveEmbedAccent(
  initialAccent: string | undefined,
  snapshot: ParentEmbedSnapshot | null,
): string | undefined {
  return normalizeAccent(initialAccent) ?? normalizeAccent(snapshot?.accent);
}

/** Merge parent brand accent into a snapshot used for iframe `src` and storage. */
export function snapshotWithResolvedAccent(
  snapshot: ParentEmbedSnapshot | null,
  initialAccent?: string,
): ParentEmbedSnapshot | null {
  const accent = resolveEmbedAccent(initialAccent, snapshot);
  if (!accent) return snapshot;
  return {
    ...snapshot,
    accent,
    updatedAt: snapshot?.updatedAt ?? Date.now(),
  };
}

/**
 * Build proxied iframe `src`. Accent is **not** appended to the URL — the parent sends
 * `elan:set-theme` via postMessage (see {@link postAccentThemeToIframe}).
 */
export function elanIframeSrcWithSnapshot(
  proxiedPath: string,
  _snapshot: ParentEmbedSnapshot | null,
  _initialAccent?: string,
): string {
  return proxiedPath;
}

/**
 * When `path` is `/`, skip the marketing home: login when logged out, last dashboard when logged in.
 */
export function resolveInitialEmbedPath(
  path: string,
  snapshot: ParentEmbedSnapshot | null,
): string {
  if (path !== "/") {
    return path;
  }
  if (snapshot?.sessionActive === false) {
    return "/login";
  }
  if (snapshot?.landingPath) {
    return snapshot.landingPath;
  }
  /** Let Élan’s `/` route resolve session server-side (avoids false logout on reload). */
  return "/";
}
