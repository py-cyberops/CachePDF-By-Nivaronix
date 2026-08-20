import { describe, expect, it } from "vitest";
import { calculateOcrTextPlacement } from "../client/src/lib/ocrPlacement";

describe("searchable OCR text placement", () => {
  it("maps an OCR bounding box into PDF coordinates with an inverted vertical axis", () => {
    expect(calculateOcrTextPlacement({ x0: 100, y0: 120, x1: 220, y1: 160 }, 1000, 2000, 500, 1000)).toEqual({ x: 50, y: 920, size: 16.4 });
  });
});
