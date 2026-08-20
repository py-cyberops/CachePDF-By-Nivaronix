# CachePDF by Nivaronix — Product Overview

CachePDF is a **Private PDF Workbench** built around one factual promise: **Your PDFs never leave your device** for supported local workflows. Its operating phrase is **Open. Work. Export. Nothing leaves.** The Nivaronix Technical Trust Ledger visual system uses near-black or paper-white surfaces, technical neutrals, and Signal Cyan (`#05C8F6`) only for active or locally verified states.

The workbench has five operating modes: **Organize** (merge, reorder, rotate, extract, delete, split), **Convert** (images to PDF and PDF-to-image export), **Mark** (watermarks and page numbers), **Read** (OCR and text extraction), and **Clean** (metadata inspection and removal). Original files remain unchanged; completed jobs generate new outputs.

The application is static and client-side: React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, and shadcn/ui primitives power the interface. `pdf-lib` performs PDF manipulation, PDF.js renders pages and raster exports, Tesseract.js runs browser-worker OCR, dnd-kit manages accessible thumbnail ordering, and fflate creates ZIP archives. No database, account system, or backend document-processing API is required for implemented workflows.
