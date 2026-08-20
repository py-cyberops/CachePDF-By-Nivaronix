/**
 * CachePDF Design Note: Tools are intentionally grouped as five operating modes so CachePDF reads
 * as one browser-local workbench—not a directory of disconnected conversion utilities.
 */
export type ToolState = "implemented" | "experimental" | "planned";
export type ToolDefinition = { slug: string; name: string; description: string; category: string; icon: string; state: ToolState; local: boolean; };

export const toolCategories: Array<{ name: string; detail: string; tools: ToolDefinition[] }> = [
  { name: "Organize", detail: "Arrange the working document, then export a new PDF.", tools: [
    { slug: "merge-pdf", name: "Merge", description: "Combine local PDFs into one document.", category: "Organize", icon: "merge", state: "implemented", local: true },
    { slug: "reorder-pages", name: "Reorder", description: "Use page thumbnails to set a new sequence.", category: "Organize", icon: "reorder", state: "implemented", local: true },
    { slug: "rotate-pages", name: "Rotate", description: "Rotate selected pages in the working copy.", category: "Organize", icon: "rotate", state: "implemented", local: true },
    { slug: "extract-pages", name: "Extract", description: "Keep selected pages in a new PDF.", category: "Organize", icon: "extract", state: "implemented", local: true },
    { slug: "delete-pages", name: "Delete", description: "Remove selected pages from a fresh output.", category: "Organize", icon: "delete", state: "implemented", local: true },
    { slug: "split-pdf", name: "Split", description: "Export selected thumbnails as individual PDFs in a ZIP.", category: "Organize", icon: "split", state: "implemented", local: true },
  ] },
  { name: "Convert", detail: "Move between image files and browser-rendered PDF pages.", tools: [
    { slug: "images-to-pdf", name: "Images → PDF", description: "Build a PDF from local PNG or JPG images.", category: "Convert", icon: "images", state: "implemented", local: true },
    { slug: "pdf-to-images", name: "PDF → Images", description: "Export selected pages as PNG, JPEG, or WebP in a ZIP.", category: "Convert", icon: "pdfimages", state: "implemented", local: true },
  ] },
  { name: "Mark", detail: "Add legible document context to a new output copy.", tools: [
    { slug: "add-watermark", name: "Watermark", description: "Place a local text watermark on a new PDF.", category: "Mark", icon: "watermark", state: "implemented", local: true },
    { slug: "add-page-numbers", name: "Page numbers", description: "Number pages in a newly generated PDF.", category: "Mark", icon: "numbers", state: "implemented", local: true },
  ] },
  { name: "Read", detail: "Render or recognize document content locally in the browser.", tools: [
    { slug: "ocr-pdf", name: "OCR", description: "Recognize selected pages in a browser worker and export text.", category: "Read", icon: "ocr", state: "implemented", local: true },
    { slug: "pdf-to-text", name: "PDF → Text", description: "Inspect text-layer extraction as an experimental browser workflow.", category: "Read", icon: "text", state: "experimental", local: true },
  ] },
  { name: "Clean", detail: "Inspect the document traces that travel beyond its pages.", tools: [
    { slug: "pdf-privacy-scanner", name: "Inspect metadata", description: "Review common document metadata locally.", category: "Clean", icon: "scan", state: "implemented", local: true },
    { slug: "remove-pdf-metadata", name: "Remove metadata", description: "Create a new output without common metadata fields.", category: "Clean", icon: "metadata", state: "implemented", local: true },
  ] },
];

export const allTools = toolCategories.flatMap((category) => category.tools);
export function getTool(slug: string) { return allTools.find((tool) => tool.slug === slug); }
export const implementedToolSlugs = new Set(allTools.filter((tool) => tool.state === "implemented").map((tool) => tool.slug));
