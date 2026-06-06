import { afterEach, describe, expect, it } from "vitest";
import {
  clearEmbedConsent,
  setEmbedConsent,
} from "../cookie-consent";
import {
  clearParentEmbedSnapshot,
  elanIframeSrcWithSnapshot,
  getParentEmbedSnapshot,
  normalizeAccent,
  resolveEmbedAccent,
  resolveInitialEmbedPath,
  setParentEmbedSnapshot,
  snapshotWithResolvedAccent,
} from "../parent-embed-storage";

describe("parent-embed-storage", () => {
  afterEach(() => {
    clearParentEmbedSnapshot();
    clearEmbedConsent();
  });

  it("stores and reads snapshot from cookie", () => {
    setEmbedConsent("accepted");
    setParentEmbedSnapshot({
      landingPath: "/prof",
      role: "professor",
      accent: "#112233",
      sessionActive: true,
    });
    const snap = getParentEmbedSnapshot();
    expect(snap?.landingPath).toBe("/prof");
    expect(snap?.accent).toBe("#112233");
    expect(snap?.sessionActive).toBe(true);
  });

  it("does not append accent to proxied iframe src (postMessage only)", () => {
    const src = elanIframeSrcWithSnapshot("/elan/prof", {
      landingPath: "/prof",
      role: "professor",
      accent: "#aabbcc",
      updatedAt: Date.now(),
    });
    expect(src).toBe("/elan/prof");
    expect(src).not.toContain("accent=");
  });

  it("prefers parent initialAccent over stored snapshot accent", () => {
    expect(resolveEmbedAccent("#E8620A", { accent: "#aabbcc", updatedAt: Date.now() })).toBe(
      "#E8620A",
    );
    const src = elanIframeSrcWithSnapshot(
      "/elan/prof",
      { accent: "#aabbcc", updatedAt: Date.now() },
      "#E8620A",
    );
    expect(src).toBe("/elan/prof");
  });

  it("uses initialAccent when snapshot has no accent", () => {
    const merged = snapshotWithResolvedAccent(null, "#112233");
    expect(merged?.accent).toBe("#112233");
    const src = elanIframeSrcWithSnapshot("/elan/", null, "#112233");
    expect(src).toBe("/elan/");
  });

  it("resolves initial path from snapshot when session active", () => {
    expect(
      resolveInitialEmbedPath("/", {
        landingPath: "/prof",
        sessionActive: true,
        updatedAt: Date.now(),
      }),
    ).toBe("/prof");
    expect(
      resolveInitialEmbedPath("/", {
        landingPath: "/prof",
        sessionActive: false,
        updatedAt: Date.now(),
      }),
    ).toBe("/login");
    expect(resolveInitialEmbedPath("/", null)).toBe("/");
  });

  it("rejects invalid accent", () => {
    expect(normalizeAccent("red")).toBeUndefined();
    expect(normalizeAccent("#aabbcc")).toBe("#aabbcc");
  });

  it("does not read or persist snapshot without cookie consent", () => {
    setParentEmbedSnapshot({
      landingPath: "/prof",
      role: "professor",
    });
    expect(getParentEmbedSnapshot()).toBeNull();
  });
});
