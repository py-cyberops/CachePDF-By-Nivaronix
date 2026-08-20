import { describe, expect, it } from "vitest";
import { getCompressionMetrics, getCompressionStatus, getTargetBytes } from "../client/src/lib/compressionMetrics";

describe("CachePDF compression metrics", () => {
  it("reports a positive measured reduction", () => {
    expect(getCompressionMetrics(1_000_000, 600_000)).toEqual({ savedBytes: 400_000, percent: 40, reduced: true, deltaBytes: -400_000 });
  });

  it("reports no reduction when a rebuilt output is larger", () => {
    expect(getCompressionMetrics(1_000, 1_200)).toEqual({ savedBytes: 0, percent: 0, reduced: false, deltaBytes: 200 });
  });

  it("calculates the approved percentage and absolute-size targets", () => {
    expect(getTargetBytes(1_000_000, "ten", 1, "MB")).toBe(900_000);
    expect(getTargetBytes(1_000_000, "twenty-five", 1, "MB")).toBe(750_000);
    expect(getTargetBytes(1_000_000, "custom", 512, "KB")).toBe(524_288);
  });

  it("uses truthful safe-result statuses", () => {
    expect(getCompressionStatus(1_000, 700, 750, true)).toBe("TARGET REACHED");
    expect(getCompressionStatus(1_000, 850, 750, true)).toBe("PARTIAL REDUCTION");
    expect(getCompressionStatus(1_000, 1_000, 1_000, false)).toBe("ALREADY OPTIMIZED");
    expect(getCompressionStatus(1_000, 1_000, 750, true)).toBe("QUALITY LOSS REQUIRED");
  });
});
