import { describe, expect, it } from "vitest";

import { isDemoEmbedPath } from "../embed-mock-session";

describe("isDemoEmbedPath", () => {
  it("matches mock embed entry paths", () => {
    expect(isDemoEmbedPath("/embed/mock")).toBe(true);
    expect(isDemoEmbedPath("/embed/mock?as=student")).toBe(true);
    expect(isDemoEmbedPath("embed/mock?as=prof")).toBe(true);
  });

  it("rejects non-mock paths", () => {
    expect(isDemoEmbedPath("/")).toBe(false);
    expect(isDemoEmbedPath("/login")).toBe(false);
    expect(isDemoEmbedPath("/eleve/demo-alice")).toBe(false);
  });
});
