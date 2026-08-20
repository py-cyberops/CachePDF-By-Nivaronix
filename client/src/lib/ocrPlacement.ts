export type OcrBoundingBox = { x0: number; y0: number; x1: number; y1: number };

export function calculateOcrTextPlacement(box: OcrBoundingBox, sourceWidth: number, sourceHeight: number, pageWidth: number, pageHeight: number) {
  const x = Math.max(0, Math.min(pageWidth, (box.x0 / sourceWidth) * pageWidth));
  const y = Math.max(0, Math.min(pageHeight, pageHeight - (box.y1 / sourceHeight) * pageHeight));
  const height = Math.max(1, ((box.y1 - box.y0) / sourceHeight) * pageHeight);
  return { x, y, size: Math.max(3, Math.min(36, height * 0.82)) };
}
