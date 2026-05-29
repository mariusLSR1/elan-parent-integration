import { describe, expect, it } from "vitest";

import {
  ELAN_MSG_EMBED_READY,
  ELAN_MSG_EMBED_STATE,
  ELAN_MSG_RESIZE,
  ELAN_MSG_SESSION,
  isElanEmbedReadyMessage,
  isElanEmbedStateMessage,
  isElanResizeMessage,
  isElanSessionMessage,
} from "../parent-messages";

describe("parent-messages (elan protocol)", () => {
  it("recognizes elan:resize", () => {
    expect(isElanResizeMessage({ type: ELAN_MSG_RESIZE, height: 400 })).toBe(true);
    expect(isElanResizeMessage({ type: "loop:resize", height: 400 })).toBe(false);
  });

  it("recognizes elan:embed-ready", () => {
    expect(isElanEmbedReadyMessage({ type: ELAN_MSG_EMBED_READY })).toBe(true);
    expect(isElanEmbedReadyMessage({ type: "loop:embed-ready" })).toBe(false);
  });

  it("recognizes elan-session-state", () => {
    expect(isElanSessionMessage({ type: ELAN_MSG_SESSION, active: true })).toBe(true);
  });

  it("recognizes elan:embed-state", () => {
    expect(
      isElanEmbedStateMessage({
        type: ELAN_MSG_EMBED_STATE,
        landingPath: "/prof",
        role: "professor",
        sessionActive: true,
      }),
    ).toBe(true);
  });
});
