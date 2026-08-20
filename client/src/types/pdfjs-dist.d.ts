/**
 * CachePDF Design Note: PDF.js ships its browser build as ESM without an exposed declaration path
 * in this package version. This declaration preserves strict project compilation while the
 * runtime module is configured with the bundled Vite worker in pdfBrowser.ts.
 */
declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(source: { data: Uint8Array }): { promise: Promise<unknown> };
}
