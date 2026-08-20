import { describe, expect, it } from "vitest";
import { getCompressionMetrics } from "../client/src/lib/compressionMetrics";

describe("CachePDF compression metrics", () => {
  it("reports a positive measured reduction", () => {
    expect(getCompressionMetrics(1_000_000, 600_000)).toEqual({ savedBytes: 400_000, percent: 40, reduced: true, deltaBytes: -400_000 });
  });

  it("reports no reduction when a rebuilt output is larger", () => {
    expect(getCompressionMetrics(1_000, 1_200)).toEqual({ savedBytes: 0, percent: 0, reduced: false, deltaBytes: 200 });
  });
});
