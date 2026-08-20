import { describe, expect, it } from "vitest";
import { calculateCenteredPdfPlacement } from "../client/src/lib/pdfPlacement";

describe("PDF signature placement", () => {
  it("centers content at a requested page percentage using PDF bottom-left coordinates", () => {
    expect(calculateCenteredPdfPlacement(600, 800, 50, 50, 200, 80)).toEqual({ x: 200, y: 360 });
  });

  it("keeps a placement inside the page bounds", () => {
    expect(calculateCenteredPdfPlacement(600, 800, 5, 95, 200, 80)).toEqual({ x: 0, y: 0 });
  });
});
