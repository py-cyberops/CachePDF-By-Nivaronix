# CachePDF Release History

## Product Record

**CachePDF by Nivaronix** is an accountless, browser-first PDF workbench. The supported document workflows operate in the browser and generate separate exports; the selected source file remains unchanged. The product record deliberately excludes cloud document storage, server-side PDF processing, in-workbench advertising, affiliate marketing, accounts, subscriptions, and paywalls.

| Product dimension | Recorded implementation |
| --- | --- |
| Brand system | CachePDF by Nivaronix, using the Nivaronix Technical Trust Ledger: near-black, paper-white, and Signal Cyan `#05C8F6`. |
| Privacy boundary | Supported document operations run in the browser; public support and advertiser flows do not receive document contents, document names, tool choices, or processing history. |
| Primary workbench | Organize, Convert, Mark, Read, and Clean operating modes. |
| Interaction model | Local file opening, PDF.js thumbnails, drag-and-drop ordering, cancellable work, explicit heavy-document preflight, and separate exports. |
| Presentation modes | Light, dark, and system theme preferences; comfortable and compact workbench density controls. |

## Capability Record

| Area | Delivered capabilities |
| --- | --- |
| Organize | Merge, split selected pages to individual PDFs, reorder by thumbnail drag-and-drop, rotate, extract, and delete pages. |
| Convert | PDF-to-PNG, JPEG, and WebP archives with output quality controls; JPG, PNG, and mixed image-to-PDF workflows. |
| Mark | Watermarks and page numbers. |
| Read | Browser-worker OCR with extracted text export and clear first-use language-data disclosure. |
| Clean | Metadata inspection and removal. |
| Resilience | Heavy-document memory guidance, cancellation and recovery states, source-file preservation checks, and an offline app-shell path. |
| Public growth | Task landing pages, privacy authority content, guides, support, advertiser inquiry, editorial policy, sitemap, and robots delivery. |

## Technology Record

| Layer | Recorded technology |
| --- | --- |
| Client | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, shadcn/ui, Lucide. |
| PDF operations | pdf-lib, PDF.js/pdfjs-dist, Tesseract.js, dnd-kit, and fflate. |
| Runtime | Express 5.2.1 with a full-stack tRPC/Drizzle/MySQL template retained for future optional support checkout setup. |
| Quality | TypeScript checking, Vitest, deterministic PDF source-invariant checks, production builds, route checks, and responsive visual inspection. |

## Checkpoint Ledger

| Checkpoint | Recorded milestone |
| --- | --- |
| `73476402` | Initial private PDF workbench, Nivaronix styling, and browser-local workflow foundation. |
| `f5af16db` | PDF.js thumbnails, accessible drag ordering, theme control, OCR, and PDF-to-image export. |
| `750a715c` | JPEG/WebP output quality controls and selected-thumbnail individual PDF split exports. |
| `0cc94347` | CachePDF brand reconciliation, five-mode information architecture, and Local Session trust language. |
| `aa98ca76` | Direct hero opening, memory-aware preflight, service-worker app shell, and supplied CachePDF asset integration. |
| `89dc0c60` | Paper-white light-mode surfaces and accessible ink/cyan treatments. |
| `24a886cd` | Local Session modal viewport containment and light-mode contrast repair. |
| `653414ac` | Launch-candidate hardening, accessibility, source invariants, cancellation, route splitting, and dependency remediation. |
| `20529b64` | V1 growth release: public growth surfaces, technical SEO, support/advertiser boundaries, homepage independence section, light-mode hover repairs, and readable navigation. |

## Validation Record

The V1 release was checked with `pnpm check`, `pnpm test`, `pnpm test:invariants`, and `pnpm build`. The Vitest run covered both the existing logout behavior and the request-origin sitemap generator. Route checks confirmed public page availability and the dynamic `sitemap.xml` and `robots.txt` responses. Desktop and mobile visual inspections covered the homepage, workbench directory, task landings, guides, support, advertiser inquiry, and the updated navigation.

> The client-side workbench keeps the stated browser-local boundary specific to supported PDF document processing. It does not claim that a browser has no network activity in general; OCR language resources may be fetched before first local recognition.
