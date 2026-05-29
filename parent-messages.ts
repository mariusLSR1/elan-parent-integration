/** Must match Élan `lib/embed/parent-messages.ts` string values. */
export const ELAN_MSG_RESIZE = "elan:resize" as const;
export const ELAN_MSG_SESSION = "elan-session-state" as const;
export const ELAN_MSG_EMBED_STATE = "elan:embed-state" as const;
export const ELAN_MSG_EMBED_READY = "elan:embed-ready" as const;

export type ElanResizeMessage = {
  type: typeof ELAN_MSG_RESIZE;
  height: number;
};

export type ElanSessionParentMessage = {
  type: typeof ELAN_MSG_SESSION;
  active: boolean;
};

export type ElanEmbedStateParentMessage = {
  type: typeof ELAN_MSG_EMBED_STATE;
  landingPath?: "/prof" | "/eleve" | "/admin";
  role?: "professor" | "student" | "admin";
  accent?: string | null;
  sessionActive?: boolean;
};

export function isElanResizeMessage(data: unknown): data is ElanResizeMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as ElanResizeMessage;
  return d.type === ELAN_MSG_RESIZE && typeof d.height === "number";
}

export function isElanSessionMessage(data: unknown): data is ElanSessionParentMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as ElanSessionParentMessage;
  return d.type === ELAN_MSG_SESSION && typeof d.active === "boolean";
}

export function isElanEmbedStateMessage(data: unknown): data is ElanEmbedStateParentMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as ElanEmbedStateParentMessage;
  if (d.type !== ELAN_MSG_EMBED_STATE) return false;
  if (d.landingPath != null && d.landingPath !== "/prof" && d.landingPath !== "/eleve" && d.landingPath !== "/admin") {
    return false;
  }
  if (d.accent != null && typeof d.accent !== "string") return false;
  return true;
}

export function isElanEmbedReadyMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  return (data as { type?: string }).type === ELAN_MSG_EMBED_READY;
}
