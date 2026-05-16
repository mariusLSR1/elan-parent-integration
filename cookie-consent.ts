/** Consent for parent-side Élan embed storage (`elan_embed_v1` cookie). */

const COOKIE_NAME = "elan_cookie_consent_v1";
const MAX_AGE_SEC = 365 * 24 * 60 * 60;

export type EmbedConsentStatus = "pending" | "accepted" | "rejected";

export const ELAN_EMBED_CONSENT_EVENT = "elan-embed-consent-change";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readConsentCookie(): string | null {
  if (!isBrowser()) {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  if (!match?.[1]) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function writeConsentCookie(value: "accepted" | "rejected"): void {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function getEmbedConsent(): EmbedConsentStatus {
  const value = readConsentCookie();
  if (value === "accepted" || value === "rejected") {
    return value;
  }
  return "pending";
}

export function setEmbedConsent(status: "accepted" | "rejected"): void {
  writeConsentCookie(status);
  window.dispatchEvent(
    new CustomEvent(ELAN_EMBED_CONSENT_EVENT, { detail: status }),
  );
}

export function clearEmbedConsent(): void {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasEmbedStorageConsent(): boolean {
  return getEmbedConsent() === "accepted";
}
