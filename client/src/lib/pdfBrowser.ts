/**
 * CachePDF Design Note: Browser PDF utilities keep document rendering and page export entirely
 * client-side, supporting the Technical Trust Ledger promise of visible local processing.
 */
import * as pdfjs from "pdfjs-dist/build/pdf.mjs";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type BrowserPdfDocument = {
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
    cleanup: () => void;
  }>;
  destroy?: () => Promise<void>;
};

export type RasterImageFormat = "png" | "jpeg" | "webp";

const rasterMimeTypes: Record<RasterImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function loadBrowserPdf(file: File): Promise<BrowserPdfDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data: bytes }).promise as Promise<BrowserPdfDocument>;
}

export async function renderPdfPageToCanvas(
  pdfDocument: BrowserPdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  maxWidth = 220,
) {
  const page = await pdfDocument.getPage(pageNumber);
  const initialViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Your browser could not create a PDF preview surface.");

  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  try { await page.render({ canvas, canvasContext: context, viewport }).promise; }
  finally { page.cleanup(); }
}

export async function renderPdfPageToImage(
  pdfDocument: BrowserPdfDocument,
  pageNumber: number,
  scale = 1.6,
  format: RasterImageFormat = "png",
  quality = 0.86,
) {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Your browser could not create an image export surface.");

  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  try { await page.render({ canvas, canvasContext: context, viewport }).promise; }
  finally { page.cleanup(); }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      canvas.width = 0;
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error(`The page image could not be encoded as ${format.toUpperCase()}.`));
    }, rasterMimeTypes[format], format === "png" ? undefined : quality);
  });
}
