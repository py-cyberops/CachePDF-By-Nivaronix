/**
 * CachePDF Design Note: The workbench makes document state legible through a controlled local
 * processing rail, explicit page thumbnails, and browser-native PDF operations. Each advanced
 * workflow discloses exactly what happens before a document is processed.
 */
import SiteShell from "@/components/SiteShell";
import PdfPageManager from "@/components/PdfPageManager";
import { ToolGlyph } from "@/components/ToolGlyph";
import { getTool, type ToolDefinition } from "@/lib/toolData";
import { loadBrowserPdf, renderPdfPageToImage, type RasterImageFormat } from "@/lib/pdfBrowser";
import { zipSync } from "fflate";
import { PDFDocument, degrees, rgb, type PDFPage } from "pdf-lib";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CircleStop,
  Clipboard,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  LockKeyhole,
  RotateCw,
  ScanText,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";
import { useDocumentSession } from "@/contexts/DocumentSessionContext";
import DensityControl from "@/components/DensityControl";
import { useDensity } from "@/contexts/DensityContext";

type LoadedFile = { file: File; name: string; size: number; pages?: number; kind: "pdf" | "image" };
type Result = { bytes: Uint8Array; name: string; mime: string; label: string };
type MemoryPreflight = { level: "notice" | "caution"; title: string; detail: string };

const pageManagerTools = new Set(["reorder-pages", "delete-pages", "rotate-pages", "split-pdf", "extract-pages", "pdf-to-images", "ocr-pdf"]);
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function getMemoryPreflight(files: LoadedFile[], slug: string): MemoryPreflight | null {
  const bytes = files.reduce((total, file) => total + file.size, 0);
  const pages = files.reduce((total, file) => total + (file.pages ?? 0), 0);
  const renderingHeavy = ["pdf-to-images", "ocr-pdf"].includes(slug);
  if (bytes >= 75 * 1024 * 1024 || pages >= 180) return { level: "caution", title: "Large document preflight", detail: `This local action will work with ${formatBytes(bytes)} across ${pages || "multiple"} pages. It may use significant browser memory. Process fewer pages or choose a compact render scale if your device slows down.` };
  if (renderingHeavy && (bytes >= 25 * 1024 * 1024 || pages >= 60)) return { level: "notice", title: "Rendering preflight", detail: `This ${pages || "multi-page"} document will be rendered locally. OCR and image export performance depends on page count and device capability.` };
  return null;
}

function parsePages(raw: string, total: number) {
  if (!raw.trim() || raw.trim().toLowerCase() === "all") return Array.from({ length: total }, (_, index) => index + 1);
  const pages: number[] = [];
  raw.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const [startText, endText] = part.split("-").map((value) => value.trim());
    const start = Number(startText); const end = endText ? Number(endText) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end)) throw new Error("Use page numbers like 1, 3-5, or 8.");
    if (start < 1 || end < 1 || start > total || end > total) throw new Error(`Page numbers must be between 1 and ${total}.`);
    const lower = Math.min(start, end); const upper = Math.max(start, end);
    for (let page = lower; page <= upper; page += 1) pages.push(page);
  });
  return Array.from(new Set(pages));
}

function safeArchiveStem(fileName: string) {
  const stem = fileName.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_").replace(/^\.+/, "").trim();
  return stem || "document";
}

function processingError(error: unknown, cancelled: boolean) {
  if (cancelled) return { title: "Local action stopped", detail: "Original unchanged. You can select fewer pages or try again when your device is ready." };
  const raw = error instanceof Error ? error.message : "";
  if (/password|encrypted/i.test(raw)) return { title: "This PDF is password protected", detail: "CachePDF cannot currently process password-protected PDFs. Original unchanged." };
  if (/memory|allocation|out of memory/i.test(raw)) return { title: "The browser ran out of available memory", detail: "No changes were made to your original file. Try fewer pages or a smaller document." };
  if (/page numbers must|use page numbers|select at least|keep at least/i.test(raw)) return { title: "Review the page selection", detail: raw };
  if (/could not be opened|invalid|malformed|parse/i.test(raw)) return { title: "This PDF could not be processed", detail: "The file may be malformed or unsupported. Original unchanged." };
  return { title: "Local export could not complete", detail: "Original unchanged. Try again or select fewer pages." };
}

function saveDownload(result: Result) {
  const browserBytes = new Uint8Array(result.bytes.byteLength);
  browserBytes.set(result.bytes);
  const url = URL.createObjectURL(new Blob([browserBytes.buffer], { type: result.mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 350);
}

function saveText(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cachepdf-ocr.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 350);
}

function stateCopy(tool: ToolDefinition) {
  if (tool.slug === "ocr-pdf") return { label: "OCR active", text: "Pages render on this device. OCR language data may load once; your PDF contents are not sent to CachePDF.", tone: "cyan" };
  if (tool.state === "implemented") return { label: "Local processing", text: "This operation runs in your browser. Your selected file stays on this device.", tone: "cyan" };
  if (tool.state === "experimental") return { label: "Experimental browser workflow", text: "The workspace is visible today; the completed processing engine is still being verified.", tone: "amber" };
  return { label: "Tool engine in development", text: "The route and its privacy boundary are in place. The document processing engine is not enabled in this build.", tone: "muted" };
}

export default function ToolWorkbench() {
  const [, params] = useRoute("/tools/:slug");
  const tool = getTool(params?.slug ?? "");
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState("");
  const [pageRule, setPageRule] = useState("all");
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [rotation, setRotation] = useState("90");
  const [watermark, setWatermark] = useState("CONFIDENTIAL");
  const [exportScale, setExportScale] = useState("1.8");
  const [imageFormat, setImageFormat] = useState<RasterImageFormat>("png");
  const [imageQuality, setImageQuality] = useState(86);
  const [preflightAcknowledged, setPreflightAcknowledged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRequested = useRef(false);
  const activeOcrWorker = useRef<{ terminate: () => Promise<unknown> } | null>(null);
  const { consumeFiles } = useDocumentSession();
  const { density } = useDensity();

  if (!tool) return <UnknownTool />;
  const mode = stateCopy(tool);
  const needsImages = tool.slug === "images-to-pdf";
  const isMerge = tool.slug === "merge-pdf";
  const isImplemented = tool.state === "implemented";
  const primaryFile = files[0];
  const pageCount = primaryFile?.pages ?? 0;
  const enoughFiles = isMerge ? files.length >= 2 : files.length >= 1;
  const hasPageManager = Boolean(primaryFile && pageCount && pageManagerTools.has(tool.slug));
  const hasPageRule = ["split-pdf", "extract-pages", "delete-pages", "rotate-pages"].includes(tool.slug);
  const preflight = getMemoryPreflight(files, tool.slug);

  function resetResultState() {
    setResult(null);
    setReport([]);
    setOcrText("");
    setOcrProgress("");
  }

  function throwIfCancelled() { if (cancelRequested.current) throw new Error("CACHEPDF_OPERATION_CANCELLED"); }
  function cancelProcessing() {
    cancelRequested.current = true;
    void activeOcrWorker.current?.terminate().catch(() => undefined);
    toast.message("Stopping local action", { description: "The original document remains unchanged." });
  }

  function resetPageState(total: number) {
    setPageOrder(Array.from({ length: total }, (_, index) => index + 1));
    setSelectedPages([]);
    setPageRotations({});
    setPageRule("all");
  }

  async function ingest(selectedFiles: FileList | File[]) {
    const candidates = Array.from(selectedFiles);
    if (!candidates.length) return;
    const accepted: LoadedFile[] = [];
    for (const file of candidates) {
      const extension = file.name.toLowerCase().split(".").pop();
      const image = file.type.startsWith("image/") || extension === "png" || extension === "jpg" || extension === "jpeg";
      const pdf = file.type === "application/pdf" || extension === "pdf";
      if ((needsImages && !image) || (!needsImages && !pdf)) { toast.error(needsImages ? "Choose PNG or JPG images for this tool." : "Choose a PDF file for this tool."); continue; }
      if (file.size > 100 * 1024 * 1024) { toast.error(`${file.name} is larger than the 100 MB browser guardrail.`); continue; }
      const record: LoadedFile = { file, name: file.name, size: file.size, kind: image ? "image" : "pdf" };
      if (pdf) {
        try { const pdfDocument = await PDFDocument.load(await file.arrayBuffer()); record.pages = pdfDocument.getPageCount(); }
        catch (error) { const message = processingError(error, false); toast.error(message.title, { description: message.detail }); continue; }
      }
      accepted.push(record);
    }
    if (!accepted.length) return;
    setPreflightAcknowledged(false);
    if (isMerge || needsImages) setFiles((current) => [...current, ...accepted]);
    else { setFiles([accepted[0]]); resetPageState(accepted[0].pages ?? 0); }
    resetResultState();
  }

  useEffect(() => {
    const pending = consumeFiles();
    if (pending.length) void ingest(pending);
  }, [consumeFiles]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void ingest(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files) void ingest(event.dataTransfer.files); };
  const removeFile = (index: number) => { setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index)); resetResultState(); if (index === 0) resetPageState(0); };
  const moveFile = (index: number, direction: -1 | 1) => { setFiles((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }); };
  const rotateThumb = (pageNumber: number) => setPageRotations((current) => ({ ...current, [pageNumber]: ((current[pageNumber] ?? 0) + 90) % 360 }));

  async function makeImagePdf() {
    const document = await PDFDocument.create();
    for (const record of files) {
      const bytes = await record.file.arrayBuffer(); const lower = record.name.toLowerCase();
      const image = lower.endsWith(".png") || record.file.type === "image/png" ? await document.embedPng(bytes) : await document.embedJpg(bytes);
      const scale = Math.min(1, 1440 / Math.max(image.width, image.height)); const width = image.width * scale; const height = image.height * scale;
      const page = document.addPage([width, height]); page.drawImage(image, { x: 0, y: 0, width, height });
    }
    return { bytes: await document.save(), name: "cachepdf-images.pdf", mime: "application/pdf", label: "PDF ready to export" };
  }

  function drawPageNumber(page: PDFPage, number: number) { const { width } = page.getSize(); page.drawText(String(number), { x: width - 42, y: 20, size: 10, color: rgb(0.17, 0.22, 0.28), opacity: 0.85 }); }
  function drawWatermark(page: PDFPage, text: string) { const { width, height } = page.getSize(); const size = Math.max(18, Math.min(width / 7, 44)); page.drawText(text, { x: width * 0.12, y: height * 0.48, size, color: rgb(0.05, 0.56, 0.72), opacity: 0.2, rotate: degrees(35) }); }
  function actionPages(total: number) { return selectedPages.length ? selectedPages : parsePages(pageRule, total); }

  async function exportImages(file: File, pages: number[]) {
    const document = await loadBrowserPdf(file);
    const archiveEntries: Record<string, Uint8Array> = {};
    const basename = safeArchiveStem(file.name);
    try {
      for (let index = 0; index < pages.length; index += 1) {
        throwIfCancelled();
        const pageNumber = pages[index];
        setOcrProgress(`Rendering page ${index + 1} of ${pages.length}`);
        const blob = await renderPdfPageToImage(document, pageNumber, Number(exportScale), imageFormat, imageQuality / 100);
        archiveEntries[`${basename}-page-${String(pageNumber).padStart(2, "0")}.${imageFormat}`] = new Uint8Array(await blob.arrayBuffer());
      }
      throwIfCancelled();
      return { bytes: zipSync(archiveEntries, { level: 6 }), name: `${basename}-${imageFormat}-images.zip`, mime: "application/zip", label: `${pages.length} ${imageFormat.toUpperCase()} pages ready to export` };
    } finally { await document.destroy?.(); }
  }

  async function splitIntoIndividualPdfs(file: File, pages: number[]) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const archiveEntries: Record<string, Uint8Array> = {};
    const basename = safeArchiveStem(file.name);
    for (let index = 0; index < pages.length; index += 1) {
      throwIfCancelled();
      const pageNumber = pages[index];
      setOcrProgress(`Creating PDF ${index + 1} of ${pages.length}`);
      const singlePageDocument = await PDFDocument.create();
      const [page] = await singlePageDocument.copyPages(source, [pageNumber - 1]);
      singlePageDocument.addPage(page);
      archiveEntries[`${basename}-page-${String(pageNumber).padStart(2, "0")}.pdf`] = await singlePageDocument.save();
    }
    throwIfCancelled();
    return { bytes: zipSync(archiveEntries, { level: 6 }), name: `${basename}-split-pages.zip`, mime: "application/zip", label: `${pages.length} individual PDFs ready to export` };
  }

  async function runOcr(file: File, pages: number[]) {
    const document = await loadBrowserPdf(file);
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, { logger: (message) => { if (message.status) setOcrProgress(`${message.status}${typeof message.progress === "number" ? ` · ${Math.round(message.progress * 100)}%` : ""}`); } });
    activeOcrWorker.current = worker;
    const pagesText: string[] = [];
    try {
      for (let index = 0; index < pages.length; index += 1) {
        throwIfCancelled();
        const pageNumber = pages[index];
        setOcrProgress(`Preparing page ${index + 1} of ${pages.length}`);
        const image = await renderPdfPageToImage(document, pageNumber, 1.8);
        const { data } = await worker.recognize(image);
        throwIfCancelled();
        pagesText.push(`Page ${pageNumber}\n${data.text.trim() || "[No readable text detected]"}`);
      }
    } finally { activeOcrWorker.current = null; await worker.terminate().catch(() => undefined); await document.destroy?.(); }
    return pagesText.join("\n\n");
  }

  async function runTool() {
    const activeTool = tool;
    if (!isImplemented || !activeTool) { toast.message("This action is not enabled yet", { description: "CachePDF keeps the route visible but does not claim local processing support before it is ready." }); return; }
    if (!enoughFiles) { toast.error(isMerge ? "Open at least two PDF files to merge." : "Open a file to continue."); return; }
    if (preflight && !preflightAcknowledged) { toast.message("Review the local memory preflight", { description: "Confirm the preflight notice before starting this action." }); return; }
    cancelRequested.current = false;
    setBusy(true); resetResultState();
    try {
      if (needsImages) { setResult(await makeImagePdf()); toast.success("PDF ready to export."); return; }
      if (isMerge) {
        const output = await PDFDocument.create();
        for (const record of files) { const source = await PDFDocument.load(await record.file.arrayBuffer()); const copied = await output.copyPages(source, source.getPageIndices()); copied.forEach((page) => output.addPage(page)); }
        setResult({ bytes: await output.save(), name: "cachepdf-merged.pdf", mime: "application/pdf", label: "Merged PDF ready to export" }); toast.success("Merged PDF ready to export."); return;
      }
      if (!primaryFile) return;
      const source = await PDFDocument.load(await primaryFile.file.arrayBuffer());
      const total = source.getPageCount();
      const selection = actionPages(total);
      if (!selection.length) throw new Error("Select at least one page before processing.");
      if (activeTool.slug === "pdf-to-images") { setResult(await exportImages(primaryFile.file, selection)); toast.success("Page images ready to export."); return; }
      if (activeTool.slug === "split-pdf") { setResult(await splitIntoIndividualPdfs(primaryFile.file, selection)); toast.success("Individual PDFs ready to export."); return; }
      if (activeTool.slug === "ocr-pdf") { const text = await runOcr(primaryFile.file, selection); setOcrText(text); setOcrProgress("OCR complete"); toast.success("OCR completed locally."); return; }
      if (activeTool.slug === "pdf-privacy-scanner") {
        const fields = [["Title", source.getTitle()], ["Author", source.getAuthor()], ["Subject", source.getSubject()], ["Keywords", source.getKeywords()], ["Creator", source.getCreator()], ["Producer", source.getProducer()], ["Created", source.getCreationDate()?.toLocaleString()], ["Modified", source.getModificationDate()?.toLocaleString()]];
        const present = fields.filter(([, value]) => Boolean(value)).map(([label, value]) => `${label}: ${value}`);
        setReport(present.length ? present : ["No common document metadata fields were found in this PDF."]); toast.success(present.length ? "Metadata found." : "No common metadata found."); return;
      }
      let output: Result;
      if (activeTool.slug === "extract-pages") {
        const next = await PDFDocument.create(); const copied = await next.copyPages(source, selection.map((page) => page - 1)); copied.forEach((page) => next.addPage(page)); output = { bytes: await next.save(), name: "cachepdf-extracted-pages.pdf", mime: "application/pdf", label: `${selection.length} pages ready to export` };
      } else if (activeTool.slug === "reorder-pages") {
        const next = await PDFDocument.create(); const copied = await next.copyPages(source, pageOrder.map((page) => page - 1)); copied.forEach((page) => next.addPage(page)); output = { bytes: await next.save(), name: "cachepdf-reordered.pdf", mime: "application/pdf", label: "Reordered PDF ready to export" };
      } else if (activeTool.slug === "delete-pages") {
        if (selection.length >= total) throw new Error("Keep at least one page in the new PDF."); Array.from(new Set(selection)).sort((a, b) => b - a).forEach((page) => source.removePage(page - 1)); output = { bytes: await source.save(), name: "cachepdf-pages-deleted.pdf", mime: "application/pdf", label: "PDF ready to export" };
      } else if (activeTool.slug === "rotate-pages") {
        source.getPages().forEach((page, index) => { const pageNumber = index + 1; const directRotation = pageRotations[pageNumber] ?? 0; const batchRotation = selection.includes(pageNumber) ? Number(rotation) : 0; if (directRotation || batchRotation) page.setRotation(degrees((page.getRotation().angle + directRotation + batchRotation) % 360)); }); output = { bytes: await source.save(), name: "cachepdf-rotated.pdf", mime: "application/pdf", label: "PDF ready to export" };
      } else if (activeTool.slug === "add-page-numbers") {
        source.getPages().forEach((page, index) => drawPageNumber(page, index + 1)); output = { bytes: await source.save(), name: "cachepdf-numbered.pdf", mime: "application/pdf", label: "PDF ready to export" };
      } else if (activeTool.slug === "add-watermark") {
        if (!watermark.trim()) throw new Error("Enter watermark text before processing."); source.getPages().forEach((page) => drawWatermark(page, watermark.trim())); output = { bytes: await source.save(), name: "cachepdf-watermarked.pdf", mime: "application/pdf", label: "PDF ready to export" };
      } else if (activeTool.slug === "remove-pdf-metadata") {
        source.setTitle(""); source.setAuthor(""); source.setSubject(""); source.setKeywords([]); source.setCreator(""); source.setProducer(""); output = { bytes: await source.save(), name: "cachepdf-metadata-removed.pdf", mime: "application/pdf", label: "Metadata removed locally" };
      } else { throw new Error("This local operation has not been configured."); }
      setResult(output); toast.success(output.label);
    } catch (error) { const message = processingError(error, cancelRequested.current); toast.error(message.title, { description: message.detail }); }
    finally { activeOcrWorker.current = null; setBusy(false); }
  }

  const pageHint = tool.slug === "delete-pages" ? "Pages to remove, e.g. 2, 5-7" : "Pages to use, e.g. 1-3, 5";
  const pageSelectionCopy = tool.slug === "delete-pages" ? "Select the pages you want removed from the new document." : tool.slug === "rotate-pages" ? "Select pages to rotate, or rotate individual thumbnail previews." : tool.slug === "ocr-pdf" ? "Select pages for local text recognition. Leave none selected to process every page." : tool.slug === "pdf-to-images" ? `Select pages to include in the ${imageFormat.toUpperCase()} archive. Leave none selected to export every page.` : tool.slug === "split-pdf" ? "Select the thumbnails that should become separate, one-page PDF files. Leave none selected to split every page." : "Select the pages to use, or leave none selected to use the page field below.";
  const processLabel = tool.slug === "pdf-to-images" ? `Export ${imageFormat.toUpperCase()} archive` : tool.slug === "split-pdf" ? "Create individual PDFs" : tool.slug === "ocr-pdf" ? "Run local OCR" : tool.name;
  const readyLabel = result?.label ?? (ocrText ? "Your extracted text is ready" : report.length ? "Local scan complete" : "Ready to process");

  return (
    <SiteShell>
      <main className={`bg-[#07090d] density-${density}`}>
        <section className="border-b border-white/[0.08] bg-[#090c11]">
          <div className="container py-7">
            <Link href="/tools" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7fe3f9] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> CachePDF workbench</Link>
            <div className="mt-7 grid gap-7 md:grid-cols-[1fr_auto] md:items-end"><div><div className="section-kicker">{tool.category}</div><div className="mt-5 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#82e7fb]"><ToolGlyph name={tool.icon} className="h-6 w-6" /></span><div><h1 className="font-display text-4xl font-semibold tracking-[-0.065em] text-white sm:text-5xl">{tool.name}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#9da9ba]">{tool.description}</p></div></div></div><div className="flex flex-wrap items-end gap-3"><DensityControl compact /><div className={`mode-badge mode-${mode.tone}`}><LockKeyhole className="h-4 w-4" /><div><p>{mode.label}</p><span>{mode.text}</span></div></div></div></div>
          </div>
        </section>
        <section className="container grid gap-7 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14">
          <div className="surface overflow-hidden"><div className="border-b border-white/[0.09] px-5 py-4 sm:px-7"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7b2c1]">01 // Select document</p></div><div className="p-5 sm:p-7"><input ref={inputRef} type="file" className="hidden" accept={needsImages ? "image/png,image/jpeg,.png,.jpg,.jpeg" : "application/pdf,.pdf"} multiple={isMerge || needsImages} onChange={onFileChange} />
            {!files.length ? <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`drop-zone ${dragging ? "drop-zone-active" : ""}`}><span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#05c8f6]"><UploadCloud className="h-6 w-6" /></span><h2 className="mt-5 font-display text-xl font-medium tracking-[-0.04em] text-white">{needsImages ? "Open PNG or JPG images locally" : isMerge ? "Open PDF files locally" : "Open a PDF locally"}</h2><p className="mt-2 text-sm leading-6 text-[#8794a6]">{needsImages ? "Create a new PDF from images on this device." : "Choose a file from this device. The original stays untouched."}</p><button type="button" onClick={() => inputRef.current?.click()} className="button-secondary mt-6">Choose file <FolderOpen className="h-4 w-4" /></button><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#697588]">Up to 100 MB per file · {needsImages ? "PNG / JPG" : "PDF"}</p></div> : <><div className="flex items-center justify-between gap-4"><div><p className="font-display text-lg font-medium tracking-[-0.04em] text-white">{files.length} {files.length === 1 ? "file open" : "files open"}</p><p className="mt-1 text-sm text-[#8794a6]">{isMerge ? "Use the arrows to set document order." : needsImages ? "Images are included in the displayed order." : "Review the controls before running the action."}</p></div><button type="button" onClick={() => inputRef.current?.click()} className="button-ghost text-sm text-[#7adff7]"><FilePlus2 className="h-4 w-4" /> Open {isMerge || needsImages ? "more files" : "another file"}</button></div><div className="mt-6 space-y-2">{files.map((file, index) => <div className="file-row" key={`${file.name}-${index}`}><span className="text-[#697689]"><GripVertical className="h-4 w-4" /></span><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.1] bg-[#0a0e14] text-[#8ee7fb]">{file.kind === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#e4ebf3]">{file.name}</p><p className="mt-0.5 font-mono text-[10px] text-[#7b8798]">{formatBytes(file.size)}{file.pages ? ` · ${file.pages} ${file.pages === 1 ? "page" : "pages"}` : ""}</p></div>{(isMerge || needsImages) && <div className="hidden items-center gap-1 sm:flex"><button className="icon-button-small" onClick={() => moveFile(index, -1)} disabled={index === 0} aria-label="Move file up"><ArrowUp className="h-3.5 w-3.5" /></button><button className="icon-button-small" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} aria-label="Move file down"><ArrowDown className="h-3.5 w-3.5" /></button></div>}<button className="icon-button-small text-[#f3a1a1] hover:border-[#ef8585]/50" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div></>}
            {preflight && <div className={`mt-6 rounded-[12px] border p-4 ${preflight.level === "caution" ? "border-[#f7ce88]/30 bg-[#f7ce88]/[0.06]" : "border-[#05c8f6]/20 bg-[#05c8f6]/[0.05]"}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d6b675]">LOCAL RESOURCE PREFLIGHT</p><h2 className="mt-2 font-display text-lg font-medium tracking-[-0.04em] text-white">{preflight.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#b6c1cf]">{preflight.detail}</p></div><button type="button" onClick={() => setPreflightAcknowledged(true)} className="button-secondary shrink-0 text-xs">{preflightAcknowledged ? "Preflight reviewed" : "Continue locally"}</button></div></div>}
            {hasPageManager && <PdfPageManager file={primaryFile.file} pageOrder={pageOrder} onPageOrderChange={setPageOrder} selectedPages={selectedPages} onSelectedPagesChange={setSelectedPages} pageRotations={pageRotations} onRotatePage={rotateThumb} reorderEnabled={tool.slug === "reorder-pages"} rotationEnabled={tool.slug === "rotate-pages"} selectionLabel={pageSelectionCopy} />}
            {files.length > 0 && <div className="mt-8 border-t border-white/[0.09] pt-7"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7b2c1]">{hasPageManager ? "03" : "02"} // Configure action</p>{hasPageRule && <label className="mt-5 block"><span className="field-label">{tool.slug === "delete-pages" ? "Pages to delete" : "Pages"}</span><input value={pageRule} onChange={(event) => setPageRule(event.target.value)} className="field-input mt-2" placeholder={pageHint} /><span className="mt-2 block text-xs leading-5 text-[#748194]">{pageHint}. Thumbnail selections take precedence.</span></label>}{tool.slug === "reorder-pages" && <p className="mt-5 rounded-[10px] border border-white/[0.1] bg-[#0a0e14] p-4 text-sm leading-6 text-[#9aa6b7]">The exported PDF uses the thumbnail order shown above. Drag a page card or use its keyboard drag control to change the sequence.</p>}{tool.slug === "split-pdf" && <p className="mt-5 rounded-[10px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.05] p-4 text-sm leading-6 text-[#9fd8e7]">Selected thumbnails become separate, one-page PDFs. CachePDF packages them into one ZIP archive for export.</p>}{tool.slug === "rotate-pages" && <label className="mt-5 block"><span className="field-label">Batch rotation for selected pages</span><select value={rotation} onChange={(event) => setRotation(event.target.value)} className="field-input mt-2"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label>}{tool.slug === "add-watermark" && <label className="mt-5 block"><span className="field-label">Watermark text</span><input value={watermark} onChange={(event) => setWatermark(event.target.value)} className="field-input mt-2" maxLength={40} /><span className="mt-2 block text-xs leading-5 text-[#748194]">CachePDF draws a light diagonal text watermark onto a new output file.</span></label>}{tool.slug === "add-page-numbers" && <p className="mt-5 rounded-[10px] border border-white/[0.1] bg-[#0a0e14] p-4 text-sm leading-6 text-[#9aa6b7]">Page numbers are drawn at the lower-right of every page in a new document copy.</p>}{tool.slug === "remove-pdf-metadata" && <p className="mt-5 rounded-[10px] border border-white/[0.1] bg-[#0a0e14] p-4 text-sm leading-6 text-[#9aa6b7]">This removes common document fields such as title, author, subject, keywords, creator, and producer from the new file.</p>}{tool.slug === "pdf-to-images" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="field-label">Image format</span><select value={imageFormat} onChange={(event) => setImageFormat(event.target.value as RasterImageFormat)} className="field-input mt-2"><option value="png">PNG · lossless</option><option value="jpeg">JPEG · compact</option><option value="webp">WebP · efficient</option></select></label><label className="block"><span className="field-label">Render scale</span><select value={exportScale} onChange={(event) => setExportScale(event.target.value)} className="field-input mt-2"><option value="1.2">Compact · faster export</option><option value="1.8">Balanced · recommended</option><option value="2.5">Detailed · larger archive</option></select></label><label className={`block sm:col-span-2 ${imageFormat === "png" ? "opacity-50" : ""}`}><span className="field-label">{imageFormat.toUpperCase()} quality <span className="ml-2 text-[#05c8f6]">{imageQuality}%</span></span><input type="range" min="45" max="100" step="1" value={imageQuality} onChange={(event) => setImageQuality(Number(event.target.value))} disabled={imageFormat === "png"} className="mt-3 h-2 w-full cursor-pointer accent-[#05c8f6] disabled:cursor-not-allowed" /><span className="mt-2 block text-xs leading-5 text-[#748194]">Quality applies to JPEG and WebP. PNG stays lossless. Large documents may use significant browser memory during local rendering.</span></label></div>}{tool.slug === "ocr-pdf" && <div className="mt-5 rounded-[10px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.05] p-4"><div className="flex gap-3"><ScanText className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="text-sm leading-6 text-[#9fd8e7]">OCR runs page images through a browser worker. English language data may load on first use; PDF contents are not sent to CachePDF.</p></div></div>}</div>}
          </div></div>
          <aside className="space-y-4"><div className="surface-quiet p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8793a5]">Processing status</p><div className="mt-5 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#05c8f6]/10 text-[#05c8f6]"><ShieldCheck className="h-4 w-4" /></span><div><p className="text-sm font-medium text-[#e3eaf2]">{mode.label}</p><p className="mt-1 text-xs leading-5 text-[#8491a3]">{mode.text}</p></div></div></div><div className="surface-quiet p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8793a5]">Original file</p><p className="mt-4 text-sm leading-6 text-[#a5b0c0]">Every completed action creates a fresh output. CachePDF does not overwrite the local source document.</p></div><div className="rounded-[14px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.055] p-5"><div className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="text-xs leading-5 text-[#a5ddeb]">{busy && ocrProgress ? ocrProgress : "Large local operations can use significant browser memory. Your original remains unchanged if an action cannot complete."}</p></div></div></aside>
        </section>
        {busy && <section className="container pb-2" aria-live="polite"><div className="flex flex-col justify-between gap-3 rounded-[12px] border border-[#05c8f6]/24 bg-[#05c8f6]/[0.06] p-4 sm:flex-row sm:items-center"><p className="text-sm text-[#a5ddeb]">{ocrProgress || "Processing on this device…"} <span className="text-[#8a9bad]">Original unchanged.</span></p><button type="button" onClick={cancelProcessing} className="button-secondary shrink-0 text-xs"><CircleStop className="h-4 w-4" /> Stop action</button></div></section>}
        {files.length > 0 && <section className="container pb-14"><div className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/[0.1] bg-[#0b1017] p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="font-display text-lg font-medium tracking-[-0.04em] text-white">{readyLabel}</p><p className="mt-1 text-sm text-[#8d99aa]">{result ? "Export the finished local output when you are ready." : ocrText ? "Copy or export the text found in the selected pages." : report.length ? "Review the fields detected in this document." : isImplemented ? "Run this action on this device." : "The file is open, but this action is not enabled yet."}</p></div>{result ? <div className="flex flex-wrap gap-3"><button onClick={() => { setFiles([]); resetResultState(); resetPageState(0); }} className="button-secondary">Open another</button><button onClick={() => saveDownload(result)} className="button-primary"><Download className="h-4 w-4" /> Export {result.mime === "application/zip" ? "files" : "PDF"}</button></div> : ocrText ? <div className="flex flex-wrap gap-3"><button onClick={() => { setFiles([]); resetResultState(); resetPageState(0); }} className="button-secondary">Open another</button><button onClick={() => void navigator.clipboard.writeText(ocrText).then(() => toast.success("OCR text copied."))} className="button-secondary"><Clipboard className="h-4 w-4" /> Copy text</button><button onClick={() => saveText(ocrText)} className="button-primary"><Download className="h-4 w-4" /> Export TXT</button></div> : <button onClick={() => void runTool()} disabled={busy || !enoughFiles} className="button-primary justify-center disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> {ocrProgress || "Processing on this device"}</> : isImplemented ? <><RotateCw className="h-4 w-4" /> {processLabel}</> : "Action coming soon"}</button>}</div>
          {result && <p className="mt-4 text-center text-xs leading-5 text-[#8190a2]">CachePDF helped? <Link href="/support" className="text-[#70dff8] hover:text-white">Support continued development →</Link> <span className="ml-1">Optional, and never required to process a document.</span></p>}
          {report.length > 0 && <div className="mt-4 rounded-[14px] border border-white/[0.1] bg-[#0a0e14] p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#05c8f6]" /><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b6c1d0]">Metadata report</p></div><div className="mt-4 divide-y divide-white/[0.08]">{report.map((line) => { const [label, ...value] = line.split(": "); return <div className="flex gap-4 py-3 text-sm" key={line}><span className="w-20 shrink-0 text-[#7f8d9f]">{label}</span><span className="break-all text-[#dce5ed]">{value.join(": ") || "None found"}</span></div>; })}</div><Link href="/tools/remove-pdf-metadata" className="button-secondary mt-5">Create a metadata-cleaned copy <ArrowRight className="h-4 w-4" /></Link></div>}
          {ocrText && <div className="mt-4 rounded-[14px] border border-[#05c8f6]/20 bg-[#0a0e14] p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><ScanText className="h-4 w-4 text-[#05c8f6]" /><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b6c1d0]">Local OCR output</p></div><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#7f8d9f]">{ocrText.length.toLocaleString()} characters</span></div><pre className="ocr-output mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[10px] border border-white/[0.08] bg-[#06090d] p-4 text-sm leading-6 text-[#dce8ef]">{ocrText}</pre></div>}
        </section>}
      </main>
    </SiteShell>
  );
}

function UnknownTool() {
  return <SiteShell><main className="container flex min-h-[55vh] flex-col justify-center py-20"><div className="section-kicker">Action unavailable</div><h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.07em] text-white">This workbench action is not on the roster.</h1><p className="mt-5 max-w-lg leading-7 text-[#98a5b5]">The route may have moved, or the requested local workflow is not currently listed.</p><Link href="/tools" className="button-primary mt-8 w-fit tracking-[0.08em]">OPEN PDF <ArrowLeft className="h-4 w-4" /></Link></main></SiteShell>;
}
