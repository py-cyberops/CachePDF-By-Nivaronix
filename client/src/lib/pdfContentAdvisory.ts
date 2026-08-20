import { loadBrowserPdf } from "./pdfBrowser";

export type PdfContentAdvisory = { kind: "text-dense" | "mixed"; message: string; textItems: number; characters: number };

export async function inspectPdfContent(file: File): Promise<PdfContentAdvisory> {
  const document = await loadBrowserPdf(file) as Awaited<ReturnType<typeof loadBrowserPdf>> & { numPages?: number; getPage: (pageNumber: number) => Promise<{ getTextContent?: () => Promise<{ items: Array<{ str?: string }> }> }> };
  try {
    let textItems = 0; let characters = 0;
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages ?? 1, 3); pageNumber += 1) {
      const page = await document.getPage(pageNumber) as unknown as { getTextContent?: () => Promise<{ items: Array<{ str?: string }> }> }; const content = await page.getTextContent?.();
      for (const item of content?.items ?? []) { textItems += 1; characters += item.str?.length ?? 0; }
    }
    const textDense = characters >= 900 || textItems >= 180;
    return textDense ? { kind: "text-dense", textItems, characters, message: "This PDF appears text- or table-dense. Lossy image compression can soften fine type and table rules; lossless optimization is recommended." } : { kind: "mixed", textItems, characters, message: "This PDF appears to contain a lighter text layer. Any lossy image compression still requires confirmation and should be compared before export." };
  } finally { await document.destroy?.().catch(() => undefined); }
}
