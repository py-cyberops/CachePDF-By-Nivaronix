import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://cachepdf.nivaronix.com";
const output = path.resolve(import.meta.dirname, "..", "dist", "public");

const pages = [
  ["/", "CachePDF by Nivaronix — The private PDF workbench", "Open, work, and export supported PDF workflows in your browser. Your selected document contents are not sent to CachePDF for supported browser-local processing.", "The private PDF workbench.", "Open. Work. Export. Nothing leaves."],
  ["/tools", "Browser-Local PDF Workbench | CachePDF", "Choose a browser-local PDF workflow to organize, convert, mark, read, or clean a document without an account.", "One local workspace for the document in front of you.", "Open a PDF, choose an operating mode, make the change locally, and export a new result."],
  ["/merge-pdf", "Merge PDF Locally | CachePDF", "Combine local PDFs into a new document in your browser with CachePDF.", "Merge PDF locally.", "Combine local PDFs into one new browser-generated document."],
  ["/split-pdf", "Split PDF into Individual Files Locally | CachePDF", "Split selected PDF pages into a ZIP of individual PDFs in your browser.", "Split PDF pages locally.", "Choose pages and create individual PDF files without a processing upload."],
  ["/reorder-pdf-pages", "Reorder PDF Pages Locally | CachePDF", "Rearrange PDF pages with local browser thumbnails and export a new PDF.", "Reorder PDF pages locally.", "Set a new page sequence in your browser and export a fresh output."],
  ["/rotate-pdf", "Rotate PDF Pages Locally | CachePDF", "Rotate selected PDF pages in a new browser-generated output.", "Rotate PDF pages locally.", "Adjust selected pages in your browser while keeping the source unchanged."],
  ["/extract-pdf-pages", "Extract PDF Pages Locally | CachePDF", "Extract selected pages to a new PDF in your browser.", "Extract PDF pages locally.", "Keep the pages you need in a separate output document."],
  ["/delete-pdf-pages", "Delete PDF Pages Locally | CachePDF", "Remove selected pages from a new PDF copy in your browser.", "Delete PDF pages locally.", "Create a fresh output without selected pages."],
  ["/jpg-to-pdf", "JPG to PDF Locally | CachePDF", "Create a PDF from local JPG images in your browser.", "JPG to PDF locally.", "Build a new PDF from images without a server-side document workflow."],
  ["/png-to-pdf", "PNG to PDF Locally | CachePDF", "Create a PDF from local PNG images in your browser.", "PNG to PDF locally.", "Build a new PDF from images on your device."],
  ["/images-to-pdf", "Images to PDF Locally | CachePDF", "Build a PDF from local PNG or JPG images in your browser.", "Images to PDF locally.", "Turn local images into a new PDF output."],
  ["/pdf-to-jpg", "PDF to JPG Locally | CachePDF", "Export selected PDF pages as JPG images in your browser.", "PDF to JPG locally.", "Render selected local PDF pages into a ZIP archive."],
  ["/pdf-to-png", "PDF to PNG Locally | CachePDF", "Export selected PDF pages as PNG images in your browser.", "PDF to PNG locally.", "Render selected local PDF pages into a ZIP archive."],
  ["/pdf-to-webp", "PDF to WebP Locally | CachePDF", "Export selected PDF pages as WebP images in your browser.", "PDF to WebP locally.", "Render selected local PDF pages into an efficient ZIP archive."],
  ["/watermark-pdf", "Watermark PDF Locally | CachePDF", "Add a local text watermark to a new PDF output in your browser.", "Watermark PDF locally.", "Place text context onto a new PDF copy without changing the source."],
  ["/add-page-numbers-pdf", "Add PDF Page Numbers Locally | CachePDF", "Add page numbers to a new PDF output in your browser.", "Add PDF page numbers locally.", "Create a new numbered PDF copy on your device."],
  ["/ocr-pdf", "OCR PDF Locally | CachePDF", "Recognize selected PDF pages in a browser worker and export local text.", "OCR PDF locally.", "Run supported text recognition in your browser. Language data may require a separate resource download."],
  ["/make-pdf-searchable", "Make a PDF Searchable Locally | CachePDF", "Add an invisible positioned OCR text layer to a new PDF in your browser with CachePDF.", "Make PDF searchable locally.", "Recognize selected scanned pages in a browser worker and create a new searchable PDF."],
  ["/sign-pdf", "Sign a PDF Locally | CachePDF", "Place a typed, drawn, or image signature on a new PDF in your browser.", "Sign PDF locally.", "Place a visual signature on a selected page and export a new PDF."],
  ["/compress-pdf", "Compress a PDF Locally | CachePDF", "Create a measured lower-footprint PDF in your browser and see the actual byte result before download.", "Compress PDF locally.", "Rebuild pages locally and review the measured result before exporting."],
  ["/document-privacy-check", "Document Privacy Check Locally | CachePDF", "Review selected common document traces locally in your browser.", "Check a PDF for common document traces.", "Inspect bounded common traces and choose supported cleanup actions explicitly."],
  ["/view-pdf-metadata", "Inspect PDF Metadata Locally | CachePDF", "Review common PDF metadata fields in your browser.", "Inspect PDF metadata locally.", "Review common document metadata without a server-side document scan."],
  ["/remove-pdf-metadata", "Remove PDF Metadata Locally | CachePDF", "Create a new PDF output with common metadata fields removed in your browser.", "Remove PDF metadata locally.", "Create a new output without common metadata fields."],
  ["/private-pdf-tools", "Private PDF Tools | CachePDF", "Understand CachePDF’s browser-local PDF processing boundary and private workflow model.", "Private PDF tools, with the boundary in view.", "Supported document operations run in your browser and create a separate output."],
  ["/how-cachepdf-works", "How CachePDF Works | Browser-Local PDF Processing", "Learn how CachePDF processes supported PDF workflows locally in the browser and keeps source files unchanged.", "Open. Work. Export. Nothing leaves.", "CachePDF is a browser-local PDF workbench for supported document operations."],
  ["/guides", "PDF Privacy Guides and Local Workflows | CachePDF", "Practical guides for browser-local PDF workflows, metadata, OCR, page ordering, and private document handling.", "Practical PDF workflows, with the processing boundary in view.", "Short guides for common local PDF tasks."],
  ["/support", "Support CachePDF | Optional, Accountless Support", "Support the independent CachePDF workbench without a subscription or document-processing paywall.", "Support CachePDF, optionally.", "Support is separate from document processing and never required to use the workbench."],
  ["/advertise", "Advertise with CachePDF | Public-Surface Inquiry", "Discuss professional sponsorship opportunities on CachePDF public surfaces without document targeting.", "Advertise without document targeting.", "Advertising eligibility is determined by public pages, never document contents or workbench activity."],
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function renderPage(template, [route, title, description, h1, body]) {
  const url = `${origin}${route}`;
  const head = `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><link rel="canonical" href="${url}" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:type" content="website" /><meta property="og:url" content="${url}" /><meta name="twitter:card" content="summary" /><meta name="twitter:title" content="${escapeHtml(title)}" /><meta name="twitter:description" content="${escapeHtml(description)}" /><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url })}</script>`;
  const bodyMarkup = `<main id="cachepdf-prerender"><header><p>CachePDF by Nivaronix</p><nav aria-label="Primary"><a href="/tools">Open PDF</a><a href="/private-pdf-tools">Private PDF tools</a><a href="/how-cachepdf-works">How CachePDF works</a><a href="/guides">Guides</a></nav></header><section><p>The private PDF workbench.</p><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(body)}</p><p><a href="/tools">Open the local workbench</a></p></section><footer><p>Your selected document contents are not sent to CachePDF for supported browser-local processing.</p></footer></main>`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace(/<div id="root"><\/div>/, `<div id="root">${bodyMarkup}</div>`);
}

const template = await readFile(path.join(output, "index.html"), "utf8");
for (const page of pages) {
  const [route] = page;
  const rendered = renderPage(template, page);
  const target = route === "/" ? path.join(output, "index.html") : path.join(output, `${route.slice(1)}.html`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, rendered);
}

console.log(`Prerendered ${pages.length} CachePDF public routes for ${origin}.`);
