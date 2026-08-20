# OnePDF by Nivaronix — Product Overview

## Brand identity

**OnePDF by Nivaronix** is a privacy-minded, browser-first PDF workbench for people who need practical document control without beginning by handing their files to a service. Its positioning is concise and operational:

> **Your files stay in the workbench.**

The visual direction is **Technical Trust Ledger**: a near-black operating surface, graphite panels, thin technical borders, and compact procedural labels. **Signal Cyan (`#05C8F6`)** is reserved for active processing, selection, completion, and keyboard focus. A restrained coral accent relates the product to Nivaronix’s identity. Light mode translates this language into paper-white document surfaces, ink text, and the supplied dark Nivaronix mark.

The personality is **exacting, discreet, and capable**. Headlines use Space Grotesk, long-form interface copy uses Manrope, and metadata uses IBM Plex Mono. Copy is direct about what happens to a document and does not overstate privacy or processing guarantees.

## Implemented feature set

| Area | Available capability |
| --- | --- |
| File handling | Drag-and-drop or file picker, PDF/image validation, file size guardrail, and original-safe new outputs. |
| Organize | Merge PDFs, reorder pages through PDF.js thumbnails and accessible drag-and-drop, extract selected pages, delete selected pages, rotate selected pages, and split selected thumbnails into individual one-page PDFs delivered in a ZIP archive. |
| Convert | Images to PDF; PDF to selected page images in **PNG, JPEG, or WebP**; configurable raster scale; adjustable JPEG/WebP quality; ZIP archive download. |
| Privacy | Local PDF metadata scanner and common-metadata removal workflow. |
| Productivity | Page-number and text-watermark generation. |
| Text recognition | Browser-worker OCR of selected pages, with copy-to-clipboard and TXT download. The English recognition model can download on first use; the document itself remains in the browser. |
| Interface | Responsive public pages, dark/light theme switcher, supplied Nivaronix dark/light logo variants, keyboard-visible focus states, mobile navigation, and reduced-motion support. |

## Technology stack

| Layer | Technology | Role |
| --- | --- | --- |
| Application | React 19, TypeScript, Vite | Client-side application runtime, type safety, and build pipeline. |
| Routing and UI | Wouter, Tailwind CSS 4, shadcn/ui primitives, Lucide | Lightweight routing, responsive styling, accessible UI primitives, and iconography. |
| PDF creation/manipulation | pdf-lib | Merge, extract, reorder, delete, rotate, split, metadata cleanup, page numbering, watermarking, and generated PDF output. |
| PDF rendering | PDF.js (`pdfjs-dist`) | In-browser page rendering for visible thumbnails and raster image export. |
| OCR | Tesseract.js | Local browser-worker recognition for selected rendered PDF pages. |
| Drag interactions | dnd-kit | Pointer and keyboard-accessible page thumbnail reordering. |
| Archive output | fflate | Browser-side ZIP generation for image batches and individual page PDFs. |
| Notifications | Sonner | Non-blocking success, progress, and validation feedback. |

## Processing model

OnePDF is a **static, client-side web application**. It does not require a database, authentication, or a backend API for the implemented workflows. Supported document operations run in the user’s browser. The interface labels local processing explicitly, and OCR explains that its recognition model may be downloaded independently of the document itself.
