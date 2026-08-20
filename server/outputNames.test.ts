import { describe, expect, it } from "vitest";
import { defaultOutputName, requestedDownloadName } from "../client/src/lib/outputNames";

describe("CachePDF export names", () => {
  it("retains the original PDF filename for PDF outputs", () => {
    expect(defaultOutputName("Board packet.pdf", "pdf")).toBe("Board packet.pdf");
  });

  it("retains a source basename when the output format must change", () => {
    expect(defaultOutputName("Board packet.pdf", "zip")).toBe("Board packet.zip");
    expect(defaultOutputName("scan-01.png", "pdf")).toBe("scan-01.pdf");
  });

  it("uses the typed filename only when a user explicitly enters one", () => {
    expect(requestedDownloadName("", "Board packet.pdf")).toBe("Board packet.pdf");
    expect(requestedDownloadName("board-review.pdf", "Board packet.pdf")).toBe("board-review.pdf");
  });
});
