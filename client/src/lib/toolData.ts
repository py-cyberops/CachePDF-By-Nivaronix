/**
 * OnePDF Design Note: Tool data is written for the Technical Trust Ledger system—precise naming,
 * explicit local-processing status, and no overstated capabilities.
 */
export type ToolState = "implemented" | "experimental" | "planned";

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  state: ToolState;
  local: boolean;
};

export const toolCategories: Array<{ name: string; detail: string; tools: ToolDefinition[] }> = [
  {
    name: "Organize PDFs",
    detail: "Shape document order without changing the original file.",
    tools: [
      { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one ordered document.", category: "Organize PDFs", icon: "merge", state: "implemented", local: true },
      { slug: "split-pdf", name: "Split PDF", description: "Turn selected page thumbnails into individual PDFs in one local ZIP archive.", category: "Organize PDFs", icon: "split", state: "implemented", local: true },
      { slug: "extract-pages", name: "Extract Pages", description: "Keep only the pages you need in a new PDF.", category: "Organize PDFs", icon: "extract", state: "implemented", local: true },
      { slug: "reorder-pages", name: "Reorder Pages", description: "Build a new PDF in an exact page sequence.", category: "Organize PDFs", icon: "reorder", state: "implemented", local: true },
      { slug: "delete-pages", name: "Delete Pages", description: "Remove selected pages from a copy of your PDF.", category: "Organize PDFs", icon: "delete", state: "implemented", local: true },
      { slug: "rotate-pages", name: "Rotate Pages", description: "Rotate chosen pages or your entire document.", category: "Organize PDFs", icon: "rotate", state: "implemented", local: true },
    ],
  },
  {
    name: "Optimize",
    detail: "Prepare documents for cleaner delivery and smaller workflows.",
    tools: [
      { slug: "compress-pdf", name: "Compress PDF", description: "Reduce PDF size where browser-side structure allows.", category: "Optimize", icon: "compress", state: "planned", local: true },
      { slug: "flatten-pdf", name: "Flatten PDF", description: "Prepare layers and annotations for final sharing.", category: "Optimize", icon: "flatten", state: "planned", local: true },
      { slug: "clean-pdf", name: "Clean PDF", description: "Create a cleaner delivery copy with clear controls.", category: "Optimize", icon: "clean", state: "planned", local: true },
    ],
  },
  {
    name: "Convert",
    detail: "Move from image files to a sharable PDF locally.",
    tools: [
      { slug: "images-to-pdf", name: "Images → PDF", description: "Turn PNG and JPG images into one PDF document.", category: "Convert", icon: "images", state: "implemented", local: true },
      { slug: "pdf-to-images", name: "PDF → Images", description: "Render selected pages as PNG, JPEG, or WebP in a local ZIP archive.", category: "Convert", icon: "pdfimages", state: "implemented", local: true },
      { slug: "pdf-to-text", name: "PDF → Text", description: "Extract readable text when the PDF contains a text layer.", category: "Convert", icon: "text", state: "experimental", local: true },
    ],
  },
  {
    name: "Security & Privacy",
    detail: "Inspect the traces your document carries before it leaves your device.",
    tools: [
      { slug: "pdf-privacy-scanner", name: "PDF Privacy Scanner", description: "Inspect standard document metadata before you share.", category: "Security & Privacy", icon: "scan", state: "implemented", local: true },
      { slug: "remove-pdf-metadata", name: "Remove PDF Metadata", description: "Clear common metadata from a new PDF copy.", category: "Security & Privacy", icon: "metadata", state: "implemented", local: true },
      { slug: "redact-pdf", name: "Redact PDF", description: "Build permanent redaction controls for sensitive content.", category: "Security & Privacy", icon: "redact", state: "planned", local: true },
      { slug: "password-protect-pdf", name: "Password Protect PDF", description: "Apply document access controls before delivery.", category: "Security & Privacy", icon: "password", state: "planned", local: true },
      { slug: "permissions-viewer", name: "PDF Permissions Viewer", description: "Review available PDF permissions and protection settings.", category: "Security & Privacy", icon: "permissions", state: "experimental", local: true },
    ],
  },
  {
    name: "Productivity",
    detail: "Apply the final document details that make delivery complete.",
    tools: [
      { slug: "add-page-numbers", name: "Add Page Numbers", description: "Number every page in a newly generated PDF.", category: "Productivity", icon: "numbers", state: "implemented", local: true },
      { slug: "add-watermark", name: "Add Watermark", description: "Stamp a clear text watermark across a document copy.", category: "Productivity", icon: "watermark", state: "implemented", local: true },
      { slug: "fill-pdf", name: "Fill PDF", description: "Complete interactive form fields in your browser.", category: "Productivity", icon: "fill", state: "planned", local: true },
      { slug: "sign-pdf", name: "Sign PDF", description: "Place a signature in a controlled signing workspace.", category: "Productivity", icon: "sign", state: "planned", local: true },
      { slug: "compare-pdfs", name: "Compare PDFs", description: "Inspect what changed between two PDF versions.", category: "Productivity", icon: "compare", state: "planned", local: true },
    ],
  },
  {
    name: "Advanced",
    detail: "Planned extensions for deeper document inspection and retrieval.",
    tools: [
      { slug: "ocr-pdf", name: "OCR PDF", description: "Recognize selected PDF pages in a browser worker and download the text.", category: "Advanced", icon: "ocr", state: "implemented", local: true },
      { slug: "extract-images", name: "Extract Images", description: "Recover embedded images from a PDF copy.", category: "Advanced", icon: "extractimages", state: "planned", local: true },
      { slug: "extract-text", name: "Extract Text", description: "Retrieve text content for downstream use.", category: "Advanced", icon: "extracttext", state: "experimental", local: true },
    ],
  },
];

export const allTools = toolCategories.flatMap((category) => category.tools);

export function getTool(slug: string) {
  return allTools.find((tool) => tool.slug === slug);
}

export const implementedToolSlugs = new Set(
  allTools.filter((tool) => tool.state === "implemented").map((tool) => tool.slug),
);
