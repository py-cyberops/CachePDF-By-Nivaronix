export function calculateCenteredPdfPlacement(pageWidth: number, pageHeight: number, xPercent: number, yPercent: number, contentWidth: number, contentHeight: number) {
  const x = Math.max(0, Math.min(pageWidth - contentWidth, pageWidth * (xPercent / 100) - contentWidth / 2));
  const y = Math.max(0, Math.min(pageHeight - contentHeight, pageHeight * (1 - yPercent / 100) - contentHeight / 2));
  return { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) };
}
