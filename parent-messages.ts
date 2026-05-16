/** Must match Élan `lib/embed/parent-messages.ts` string values. */
export const LOOP_MSG_RESIZE = "loop:resize" as const;
export const LOOP_MSG_SESSION = "loop-session-state" as const;
export const LOOP_MSG_EMBED_STATE = "loop:embed-state" as const;
export const LOOP_MSG_EMBED_READY = "loop:embed-ready" as const;

export type LoopResizeMessage = {
  type: typeof LOOP_MSG_RESIZE;
  height: number;
};

export type LoopSessionParentMessage = {
  type: typeof LOOP_MSG_SESSION;
  active: boolean;
};

export type LoopEmbedStateParentMessage = {
  type: typeof LOOP_MSG_EMBED_STATE;
  landingPath?: "/prof" | "/eleve" | "/admin";
  role?: "professor" | "student" | "admin";
  accent?: string | null;
  sessionActive?: boolean;
};

export function isLoopResizeMessage(data: unknown): data is LoopResizeMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as LoopResizeMessage;
  return d.type === LOOP_MSG_RESIZE && typeof d.height === "number";
}

export function isLoopSessionMessage(data: unknown): data is LoopSessionParentMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as LoopSessionParentMessage;
  return d.type === LOOP_MSG_SESSION && typeof d.active === "boolean";
}

export function isLoopEmbedStateMessage(data: unknown): data is LoopEmbedStateParentMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as LoopEmbedStateParentMessage;
  if (d.type !== LOOP_MSG_EMBED_STATE) return false;
  if (d.landingPath != null && d.landingPath !== "/prof" && d.landingPath !== "/eleve" && d.landingPath !== "/admin") {
    return false;
  }
  if (d.accent != null && typeof d.accent !== "string") return false;
  return true;
}

export function isLoopEmbedReadyMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  return (data as { type?: string }).type === LOOP_MSG_EMBED_READY;
}
