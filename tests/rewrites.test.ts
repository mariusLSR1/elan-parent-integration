import { afterEach, describe, expect, it, vi } from "vitest";

import { elanProxyRewrites } from "../rewrites";

describe("elanProxyRewrites", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty list when ELAN_ORIGIN is unset", () => {
    vi.stubEnv("ELAN_ORIGIN", "");
    expect(elanProxyRewrites()).toEqual([]);
  });

  it("proxies /elan without a trailing slash on the Élan origin (avoids 308 loop)", () => {
    vi.stubEnv("ELAN_ORIGIN", "https://elan.referenceprof.fr");
    expect(elanProxyRewrites()).toEqual([
      { source: "/elan", destination: "https://elan.referenceprof.fr/elan" },
      { source: "/elan/", destination: "https://elan.referenceprof.fr/elan" },
      {
        source: "/elan/:path*",
        destination: "https://elan.referenceprof.fr/elan/:path*",
      },
    ]);
  });
});
