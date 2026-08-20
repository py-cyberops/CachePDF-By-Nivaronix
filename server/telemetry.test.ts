import { describe, expect, it } from "vitest";
import { sanitizeTelemetryProperties } from "../client/src/lib/telemetry";

describe("CachePDF privacy-safe telemetry", () => {
  it("keeps product-state fields while excluding document-sensitive fields", () => {
    expect(sanitizeTelemetryProperties({ tool: "merge-pdf", outcome: "completed", filename: "contract.pdf", ocrText: "sensitive", documentHash: "x" })).toEqual({ tool: "merge-pdf", outcome: "completed" });
  });
});
