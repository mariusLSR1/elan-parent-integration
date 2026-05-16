"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn, elanButtonClass } from "./constants";
import { isErrorPageDocument } from "./errorDetection";
import { iframePostMessageTargetOrigin, postAccentThemeToIframe } from "./parent-accent-theme";
import {
  elanIframeSrcWithSnapshot,
  getParentEmbedSnapshot,
  normalizeAccent,
  resolveEmbedAccent,
  resolveInitialEmbedPath,
  setParentEmbedSnapshot,
  snapshotWithResolvedAccent,
  type ParentEmbedSnapshot,
} from "./parent-embed-storage";
import {
  isLoopEmbedReadyMessage,
  isLoopEmbedStateMessage,
  isLoopResizeMessage,
  isLoopSessionMessage,
} from "./parent-messages";
import { ELAN_EMBED_CONSENT_EVENT } from "./cookie-consent";
import { ElanParentSkeleton, skeletonVariantFromSnapshot } from "./ElanParentSkeleton";
import { elanProxiedPath } from "./paths";
const RETRY_MIN_LOAD_MS = 2_500;
/** Fallback if the iframe never posts `loop:embed-ready` (standalone / old builds). */
const EMBED_READY_FALLBACK_MS = 20_000;

type Phase = "loading" | "ready" | "error";

export type ElanIframeProps = {
  /** App path after the proxy prefix, e.g. `"/"` or `"/login"`. Always same-origin on the parent. */
  path?: string;
  title?: string;
  wrapperClassName?: string;
  iframeClassName?: string;
  /** Minimum height before first resize message */
  minHeight?: number;
  /**
   * When true (default), stores accent / landing path / session hints from the iframe
   * in parent cookies (`elan_embed_v1`) on first `loop:embed-state` message.
   */
  persistEmbedState?: boolean;
  /** Written on the parent before the first iframe response (e.g. brand accent `#rrggbb`). */
  initialAccent?: string;
  /** Show a layout skeleton on the parent while the iframe loads. Default true. */
  showSkeleton?: boolean;
  /** Override skeleton layout (otherwise inferred from stored embed snapshot). */
  skeletonVariant?: "prof" | "student" | "generic";
};

function ElanErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-background px-6 text-center"
      role="alert"
    >
      <h2
        className="max-w-md text-2xl tracking-tight text-foreground sm:text-3xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
      >
        Service momentanément indisponible
      </h2>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        Une erreur s&apos;est produite de notre côté. Nous travaillons à rétablir
        l&apos;accès au plus vite. Merci de votre patience.
      </p>
      <button type="button" className={elanButtonClass("secondary")} onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Embeds Élan under the parent origin (e.g. `https://parent.com/elan/...`).
 * Height syncs when Élan posts `{ type: "loop:resize", height: number }`.
 * Requires parent `next.config` rewrites from {@link elanProxyRewrites}.
 */
function readEmbedSnapshotOnClient(
  persistEmbedState: boolean,
  initialAccent?: string,
): ParentEmbedSnapshot | null {
  if (typeof window === "undefined") return null;
  const stored = persistEmbedState ? getParentEmbedSnapshot() : null;
  return snapshotWithResolvedAccent(stored, initialAccent);
}

function buildIframeSrc(
  path: string,
  snapshot: ParentEmbedSnapshot | null,
  initialAccent: string | undefined,
  retryCount: number,
): string {
  const merged = snapshotWithResolvedAccent(snapshot, initialAccent);
  const appPath = resolveInitialEmbedPath(path, merged);
  let src = elanIframeSrcWithSnapshot(elanProxiedPath(appPath), merged, initialAccent);
  const sep = src.includes("?") ? "&" : "?";
  src += `${sep}embedLoader=parent`;
  if (retryCount > 0) {
    src += `&_retry=${retryCount}`;
  }
  return src;
}

export function ElanIframe({
  path = "/",
  title = "Élan",
  wrapperClassName = "relative w-full",
  iframeClassName = "w-full border-0",
  minHeight = 400,
  persistEmbedState = true,
  initialAccent,
  showSkeleton = true,
  skeletonVariant,
}: ElanIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialAccentRef = useRef(initialAccent);
  initialAccentRef.current = initialAccent;
  const phaseRef = useRef<Phase>("loading");
  const loadStartedAtRef = useRef(0);
  const minLoadMsRef = useRef(0);
  const isRetryAttemptRef = useRef(false);
  const embedReadyFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [embedSnapshot, setEmbedSnapshot] = useState<ParentEmbedSnapshot | null>(() =>
    readEmbedSnapshotOnClient(persistEmbedState, initialAccent),
  );

  phaseRef.current = phase;

  const refreshEmbedSnapshot = useCallback(() => {
    const accent = normalizeAccent(initialAccent);
    if (persistEmbedState && accent) {
      setParentEmbedSnapshot({ accent });
    }
    const stored = persistEmbedState ? getParentEmbedSnapshot() : null;
    setEmbedSnapshot(snapshotWithResolvedAccent(stored, initialAccent));
  }, [persistEmbedState, initialAccent]);

  useEffect(() => {
    refreshEmbedSnapshot();
  }, [refreshEmbedSnapshot]);

  useEffect(() => {
    function onConsentChange() {
      refreshEmbedSnapshot();
    }
    window.addEventListener(ELAN_EMBED_CONSENT_EVENT, onConsentChange);
    return () => window.removeEventListener(ELAN_EMBED_CONSENT_EVENT, onConsentChange);
  }, [refreshEmbedSnapshot]);

  const iframeSrc = useMemo(
    () => buildIframeSrc(path, embedSnapshot, initialAccent, retryCount),
    [path, embedSnapshot, initialAccent, retryCount],
  );

  const pushParentAccentToIframe = useCallback(() => {
    const accent = resolveEmbedAccent(initialAccent, embedSnapshot);
    if (!accent) return;
    postAccentThemeToIframe(
      iframeRef.current?.contentWindow,
      accent,
      iframePostMessageTargetOrigin(iframeSrc),
    );
  }, [initialAccent, embedSnapshot, iframeSrc]);

  const showIframe = phase !== "error";
  const showParentSkeleton = showSkeleton && phase === "loading";
  const resolvedSkeletonVariant =
    skeletonVariant ??
    skeletonVariantFromSnapshot(embedSnapshot?.role, embedSnapshot?.landingPath);

  const inspectIframeDocument = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return false;
    }

    try {
      const doc = iframe.contentDocument;
      if (doc && isErrorPageDocument(doc)) {
        setPhase("error");
        return true;
      }
    } catch {
      // Cross-origin: cannot inspect.
    }

    return false;
  }, []);

  const finishLoading = useCallback(async () => {
    if (phaseRef.current !== "loading") {
      return;
    }

    if (inspectIframeDocument()) {
      return;
    }

    const remaining = minLoadMsRef.current - (Date.now() - loadStartedAtRef.current);
    if (remaining > 0) {
      await delay(remaining);
    }

    if (phaseRef.current !== "loading") {
      return;
    }

    if (!inspectIframeDocument()) {
      setPhase("ready");
    }
  }, [inspectIframeDocument]);

  const beginLoad = useCallback(() => {
    loadStartedAtRef.current = Date.now();
    minLoadMsRef.current = isRetryAttemptRef.current ? RETRY_MIN_LOAD_MS : 0;
    isRetryAttemptRef.current = false;
    setPhase("loading");
  }, []);

  useEffect(() => {
    beginLoad();
  }, [iframeSrc, beginLoad]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      const d = event.data;
      if (isLoopResizeMessage(d)) {
        iframe.style.height = `${Math.max(minHeight, d.height)}px`;
        return;
      }

      if (isLoopEmbedReadyMessage(d)) {
        if (embedReadyFallbackTimerRef.current) {
          clearTimeout(embedReadyFallbackTimerRef.current);
          embedReadyFallbackTimerRef.current = null;
        }
        void finishLoading();
        return;
      }

      if (!persistEmbedState) return;

      if (isLoopSessionMessage(d)) {
        setParentEmbedSnapshot({ sessionActive: d.active });
        return;
      }

      if (isLoopEmbedStateMessage(d)) {
        const parentAccent = normalizeAccent(initialAccentRef.current);
        setParentEmbedSnapshot({
          landingPath: d.landingPath,
          role: d.role,
          accent: parentAccent ?? normalizeAccent(d.accent ?? undefined),
          sessionActive: d.sessionActive,
        });
        if (phaseRef.current === "loading") {
          const stored = getParentEmbedSnapshot();
          setEmbedSnapshot(snapshotWithResolvedAccent(stored, initialAccentRef.current));
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight, persistEmbedState, finishLoading]);

  useEffect(() => {
    return () => {
      if (embedReadyFallbackTimerRef.current) {
        clearTimeout(embedReadyFallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    pushParentAccentToIframe();
  }, [phase, pushParentAccentToIframe]);

  function handleIframeLoad() {
    pushParentAccentToIframe();
    if (embedReadyFallbackTimerRef.current) {
      clearTimeout(embedReadyFallbackTimerRef.current);
    }
    embedReadyFallbackTimerRef.current = setTimeout(() => {
      embedReadyFallbackTimerRef.current = null;
      if (phaseRef.current === "loading") {
        void finishLoading();
      }
    }, EMBED_READY_FALLBACK_MS);
  }

  function handleRetry() {
    isRetryAttemptRef.current = true;
    setRetryCount((n) => n + 1);
    beginLoad();
  }

  return (
    <div className={cn("relative h-full w-full", wrapperClassName)}>
      {phase === "error" ? <ElanErrorFallback onRetry={handleRetry} /> : null}

      {showIframe ? (
        <iframe
          key={iframeSrc}
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          className={cn(
            iframeClassName,
            phase !== "ready" && "pointer-events-none opacity-0",
          )}
          style={{ minHeight }}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleIframeLoad}
        />
      ) : null}

      {showParentSkeleton ? (
        <ElanParentSkeleton variant={resolvedSkeletonVariant} minHeight={minHeight} />
      ) : null}
    </div>
  );
}
