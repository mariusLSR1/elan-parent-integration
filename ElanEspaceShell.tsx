"use client";

import { useSyncExternalStore } from "react";

import {
  ELAN_EMBED_CONSENT_EVENT,
  hasEmbedStorageConsent,
} from "./cookie-consent";
import { cn, SITE_BRAND_ACCENT } from "./constants";
import { ElanCookieConsent } from "./ElanCookieConsent";
import { ElanIframe, type ElanIframeProps } from "./ElanIframe";

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener(ELAN_EMBED_CONSENT_EVENT, onStoreChange);
  return () => window.removeEventListener(ELAN_EMBED_CONSENT_EVENT, onStoreChange);
}

export type ElanEspaceShellProps = Omit<ElanIframeProps, "persistEmbedState"> & {
  policyHref?: string;
};

/**
 * Élan embed for `/espace-elan`: cookie consent first, iframe only after acceptance.
 */
export function ElanEspaceShell({
  policyHref,
  initialAccent = SITE_BRAND_ACCENT,
  ...iframeProps
}: ElanEspaceShellProps) {
  const canLoadIframe = useSyncExternalStore(
    subscribeToConsent,
    () => hasEmbedStorageConsent(),
    () => false,
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        canLoadIframe && "min-h-0 flex-1",
      )}
    >
      <ElanCookieConsent policyHref={policyHref} />
      {canLoadIframe ? (
        <ElanIframe
          {...iframeProps}
          initialAccent={initialAccent}
          persistEmbedState
        />
      ) : null}
    </div>
  );
}
