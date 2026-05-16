"use client";

import { useSyncExternalStore } from "react";

import { cn, elanButtonClass } from "./constants";
import { clearParentEmbedSnapshot } from "./parent-embed-storage";
import {
  ELAN_EMBED_CONSENT_EVENT,
  getEmbedConsent,
  setEmbedConsent,
  type EmbedConsentStatus,
} from "./cookie-consent";

export type ElanCookieConsentProps = {
  className?: string;
  /** Link to your cookies / privacy policy page. */
  policyHref?: string;
  onConsentChange?: (status: Exclude<EmbedConsentStatus, "pending">) => void;
};

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener(ELAN_EMBED_CONSENT_EVENT, onStoreChange);
  return () => window.removeEventListener(ELAN_EMBED_CONSENT_EVENT, onStoreChange);
}

function getConsentSnapshot(): EmbedConsentStatus {
  return getEmbedConsent();
}

/**
 * Cookie notice for the Élan embed. Mount on `/espace-elan` only.
 * Hidden after acceptance (stored in cookie for 1 year). Shown again on each visit if refused.
 */
export function ElanCookieConsent({
  className,
  policyHref = "/contact#mentions",
  onConsentChange,
}: ElanCookieConsentProps) {
  const status = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    () => "pending" as EmbedConsentStatus,
  );

  if (status === "accepted") {
    return null;
  }

  function applyConsent(next: "accepted" | "rejected") {
    setEmbedConsent(next);
    if (next === "rejected") {
      clearParentEmbedSnapshot();
    }
    onConsentChange?.(next);
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-background p-6",
        className,
      )}
      role="dialog"
      aria-labelledby="elan-cookie-consent-title"
      aria-describedby="elan-cookie-consent-desc"
    >
      <div className="w-full max-w-lg space-y-6 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p
            id="elan-cookie-consent-title"
            className="text-xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Cookies — espace Élan
          </p>
          <p id="elan-cookie-consent-desc">
            Pour ouvrir l&apos;espace Élan, nous avons besoin d&apos;un cookie
            technique qui mémorise vos préférences (connexion, thème). Aucun cookie
            publicitaire.{" "}
            {policyHref ? (
              <a
                href={policyHref}
                className="text-primary underline-offset-2 hover:underline"
              >
                En savoir plus
              </a>
            ) : null}
          </p>
          {status === "rejected" ? (
            <p className="text-foreground">
              L&apos;espace Élan ne peut pas être affiché sans ce cookie. Vous
              pouvez accepter ci-dessous pour continuer.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={elanButtonClass("ghost", "w-full sm:w-auto")}
            onClick={() => applyConsent("rejected")}
          >
            Refuser
          </button>
          <button
            type="button"
            className={elanButtonClass("primary", "w-full sm:w-auto")}
            onClick={() => applyConsent("accepted")}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
