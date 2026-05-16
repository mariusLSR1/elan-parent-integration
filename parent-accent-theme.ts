/** Must match Élan `ThemeMessageBridge` (`loop:set-theme`). */
export const LOOP_MSG_SET_THEME = "loop:set-theme" as const;

export function darkenHex(hex: string, amount = 20): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function themeVarsFromAccent(accent: string): Record<string, string> {
  return {
    "--loop-primary": accent,
    "--loop-primary-hover": darkenHex(accent),
  };
}

/** Push parent brand accent into the iframe (proxied same-origin or cross-origin). */
export function postAccentThemeToIframe(
  target: Window | null | undefined,
  accent: string,
  targetOrigin: string,
): void {
  if (!target || !targetOrigin) return;
  target.postMessage(
    {
      type: LOOP_MSG_SET_THEME,
      vars: themeVarsFromAccent(accent),
    },
    targetOrigin,
  );
}

export function iframePostMessageTargetOrigin(iframeSrc: string): string {
  try {
    return new URL(iframeSrc, typeof window !== "undefined" ? window.location.href : undefined)
      .origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
}
