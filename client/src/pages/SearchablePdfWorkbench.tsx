import DensityControl from "@/components/DensityControl";
import SiteShell from "@/components/SiteShell";
import { Progress } from "@/components/ui/progress";
import { defaultOutputName, requestedDownloadName } from "@/lib/outputNames";
import { calculateOcrTextPlacement, type OcrBoundingBox } from "@/lib/ocrPlacement";
import { loadBrowserPdf, renderPdfPageToImage } from "@/lib/pdfBrowser";
import { isNativeAndroid, shareNativeExport } from "@/lib/nativeFiles";
import { trackCachePdfEvent } from "@/lib/telemetry";
import { PDFDocument, rgb } from "pdf-lib";
import { ArrowLeft, CircleStop, Download, FilePlus2, FileSearch, FolderOpen, LoaderCircle, ScanText, ShieldCheck, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type SearchableResult = { bytes: Uint8Array; name: string; pages: number };
type RecognizedWord = { text?: string; bbox?: OcrBoundingBox };

function parsePageRange(raw: string, total: number) {
  if (!raw.trim() || raw.trim().toLowerCase() === "all") return Array.from({ length: total }, (_, index) => index + 1);
  const numbers = new Set<number>();
  raw.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const [startRaw, endRaw] = part.split("-").map((value) => value.trim());
    const start = Number(startRaw); const end = endRaw ? Number(endRaw) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > total || end > total) throw new Error(`Use page numbers from 1 to ${total}, such as 1, 3-5, or all.`);
    for (let value = Math.min(start, end); value <= Math.max(start, end); value += 1) numbers.add(value);
  });
  return Array.from(numbers).sort((a, b) => a - b);
}

export default function SearchablePdfWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRule, setPageRule] = useState("all");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<SearchableResult | null>(null);
  const [downloadName, setDownloadName] = useState("");

  async function openFile(candidate?: File) {
    if (!candidate) return;
    const extension = candidate.name.toLowerCase().split(".").pop();
    if (candidate.type !== "application/pdf" && extension !== "pdf") { toast.error("Choose a PDF file for searchable PDF creation."); return; }
    if (candidate.size > 100 * 1024 * 1024) { toast.error("This PDF is larger than the 100 MB browser guardrail."); return; }
    try {
      const source = await PDFDocument.load(await candidate.arrayBuffer());
      setFile(candidate); setPageCount(source.getPageCount()); setPageRule("all"); setResult(null); setDownloadName(""); setProgress(""); setProgressPercent(0);
      trackCachePdfEvent("workbench_opened", { tool: "make-pdf-searchable" });
    } catch {
      toast.error("This PDF could not be opened. Your source file remains unchanged.", { description: "Try another supported, non-password-protected PDF." });
    }
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { void openFile(event.target.files?.[0]); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void openFile(event.dataTransfer.files?.[0]); };

  async function createSearchablePdf() {
    if (!file || !pageCount) return;
    let pages: number[];
    try { pages = parsePageRange(pageRule, pageCount); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Review the selected page range."); return; }
    setBusy(true); setProgress("Preparing local OCR"); setProgressPercent(0); setResult(null); trackCachePdfEvent("operation_started", { tool: "make-pdf-searchable" });
    let browserPdf: Awaited<ReturnType<typeof loadBrowserPdf>> | null = null;
    try {
      const output = await PDFDocument.load(await file.arrayBuffer());
      browserPdf = await loadBrowserPdf(file);
      const { createWorker } = await import("tesseract.js");
      let activePageIndex = 0;
      const worker = await createWorker("eng", 1, { logger: (message) => {
        if (!message.status) return;
        const workerPercent = typeof message.progress === "number" ? Math.max(0, Math.min(1, message.progress)) : 0;
        const overallPercent = Math.min(99, Math.round(((activePageIndex + workerPercent) / pages.length) * 100));
        setProgressPercent(overallPercent);
        setProgress(`${message.status}${typeof message.progress === "number" ? ` · ${Math.round(workerPercent * 100)}%` : ""}`);
      } });
      workerRef.current = worker;
      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = pages[index];
        activePageIndex = index;
        setProgress(`Recognizing page ${index + 1} of ${pages.length}`);
        setProgressPercent(Math.round((index / pages.length) * 100));
        const image = await renderPdfPageToImage(browserPdf, pageNumber, 1.8, "png");
        const { data } = await worker.recognize(image);
        const page = output.getPage(pageNumber - 1);
        const { width, height } = page.getSize();
        const imageWidth = Math.max(1, (data as { imageWidth?: number }).imageWidth ?? 1);
        const imageHeight = Math.max(1, (data as { imageHeight?: number }).imageHeight ?? 1);
        const words = ((data as unknown as { words?: RecognizedWord[] }).words ?? []).filter((word) => word.text?.trim() && word.bbox);
        words.forEach((word) => {
          const placement = calculateOcrTextPlacement(word.bbox!, imageWidth, imageHeight, width, height);
          page.drawText(word.text!.trim(), { x: placement.x, y: placement.y, size: placement.size, color: rgb(0, 0, 0), opacity: 0 });
        });
        setProgressPercent(Math.round(((index + 1) / pages.length) * 100));
      }
      const bytes = await output.save();
      const next = { bytes, name: defaultOutputName(file.name, "pdf"), pages: pages.length };
      setResult(next); setDownloadName(next.name); setProgress("Searchable PDF ready"); setProgressPercent(100); trackCachePdfEvent("operation_completed", { tool: "make-pdf-searchable", output: "pdf" });
      toast.success("Searchable PDF created locally.");
    } catch (error) {
      const detail = error instanceof Error && /cancel/i.test(error.message) ? "Searchable PDF creation stopped. Your source file remains unchanged." : "Searchable PDF creation could not complete. Your source file remains unchanged. Try fewer pages or a different PDF.";
      trackCachePdfEvent("operation_failed", { tool: "make-pdf-searchable" }); toast.error(detail);
    } finally {
      await workerRef.current?.terminate().catch(() => undefined); workerRef.current = null; await browserPdf?.destroy?.().catch(() => undefined); setBusy(false);
    }
  }

  function cancel() { void workerRef.current?.terminate().catch(() => undefined); workerRef.current = null; setProgress("Stopping local OCR"); }

  async function download() {
    if (!result) return;
    const bytes = new Uint8Array(result.bytes.byteLength); bytes.set(result.bytes);
    const name = requestedDownloadName(downloadName, result.name); const blob = new Blob([bytes.buffer], { type: "application/pdf" });
    if (isNativeAndroid()) { await shareNativeExport("Save searchable CachePDF result", name, blob); trackCachePdfEvent("export_completed", { output: "pdf" }); return; }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    trackCachePdfEvent("export_completed", { output: "pdf" });
  }

  return <SiteShell><main className="bg-[#07090d]"><section className="border-b border-white/[0.08] bg-[#090c11]"><div className="container py-8 md:py-12"><Link href="/tools" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[#7fe3f9]"><ArrowLeft className="h-3.5 w-3.5" /> CachePDF workbench</Link><div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="section-kicker">Read · browser-local OCR</div><h1 className="mt-5 font-display text-4xl font-semibold tracking-[-.065em] text-white sm:text-5xl">Make PDF searchable.</h1><p className="mt-4 max-w-2xl leading-7 text-[#9da9ba]">Recognize selected scanned pages in a browser worker and add an invisible, positioned text layer to a new PDF. The visible page appearance remains unchanged.</p></div><DensityControl compact /></div></div></section><section className="container grid gap-7 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14"><div className="surface p-5 sm:p-7"><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFileChange} />{!file ? <div className={`drop-zone ${dragging ? "drop-zone-active" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#05c8f6]"><UploadCloud className="h-6 w-6" /></span><h2 className="mt-5 font-display text-xl font-medium text-white">Open a scanned PDF locally</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#8794a6]">Choose a PDF from this device. The source remains unchanged; CachePDF prepares a separate searchable result.</p><button type="button" onClick={() => inputRef.current?.click()} className="button-secondary mt-6">Choose PDF <FolderOpen className="h-4 w-4" /></button></div> : <div><div className="flex items-start justify-between gap-4 border-b border-white/[.08] pb-6"><div><p className="font-display text-lg font-medium text-white">{file.name}</p><p className="mt-1 text-sm text-[#8794a6]">{pageCount} {pageCount === 1 ? "page" : "pages"} · local OCR only</p></div><button type="button" className="button-ghost text-sm text-[#7adff7]" onClick={() => inputRef.current?.click()}><FilePlus2 className="h-4 w-4" /> Replace</button></div><label className="mt-7 block"><span className="field-label">Pages to make searchable</span><input value={pageRule} onChange={(event) => setPageRule(event.target.value)} className="field-input mt-2" placeholder="all or 1, 3-5" disabled={busy} /><span className="mt-2 block text-xs leading-5 text-[#748194]">Use all, individual page numbers, or ranges. OCR language data may require a network download before first use.</span></label><div className="mt-7 rounded-[12px] border border-[#05c8f6]/20 bg-[#05c8f6]/[.05] p-4"><div className="flex gap-3"><ScanText className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="text-sm leading-6 text-[#9fd8e7]">Text is recognized locally in a browser worker. CachePDF does not receive the selected PDF contents or recognized text for this supported workflow.</p></div></div></div>}</div><aside className="space-y-4"><div className="surface-quiet p-5"><FileSearch className="h-5 w-5 text-[#05c8f6]" /><h2 className="mt-4 font-display text-lg font-medium text-white">Searchable layer</h2><p className="mt-2 text-sm leading-6 text-[#8794a6]">The output keeps the original visual page and adds transparent recognized words at approximate page positions for search and copy where supported by the viewer.</p></div><div className="surface-quiet p-5"><ShieldCheck className="h-5 w-5 text-[#05c8f6]" /><h2 className="mt-4 font-display text-lg font-medium text-white">Original-safe</h2><p className="mt-2 text-sm leading-6 text-[#8794a6]">A fresh PDF is generated for export. The selected source file is never overwritten.</p></div></aside></section>{file && <section className="container pb-14"><div className="rounded-[16px] border border-white/[.1] bg-[#0b1017] p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-display text-lg font-medium text-white">{result ? `Searchable PDF ready · ${result.pages} ${result.pages === 1 ? "page" : "pages"}` : busy ? progress || "Working locally" : "Ready to create a searchable PDF"}</p><p className="mt-1 text-sm text-[#8d99aa]">{result ? "Review the output in your PDF viewer and use search to confirm recognized text." : "The original PDF remains unchanged."}</p></div>{busy ? <button type="button" onClick={cancel} className="button-secondary"><CircleStop className="h-4 w-4" /> Stop action</button> : result ? <button type="button" onClick={download} className="button-primary"><Download className="h-4 w-4" /> Export searchable PDF</button> : <button type="button" onClick={() => void createSearchablePdf()} className="button-primary"><LoaderCircle className="h-4 w-4" /> Create searchable PDF</button>}</div>{busy && <div className="mt-5 max-w-xl" role="status" aria-live="polite"><div className="flex items-center justify-between gap-4 text-xs font-medium text-[#9fd8e7]"><span>Local OCR progress</span><span>{progressPercent}%</span></div><Progress value={progressPercent} className="mt-2 bg-white/[.1] [&>div]:bg-[#05c8f6]" /><p className="mt-2 text-xs leading-5 text-[#8d99aa]">{progress || "Preparing the local OCR worker"}</p></div>}{result && <label className="mt-5 block max-w-xl"><span className="field-label">Export filename</span><input value={downloadName} onChange={(event) => setDownloadName(event.target.value)} className="field-input mt-2" aria-label="Searchable PDF export filename" /><span className="mt-2 block text-xs leading-5 text-[#748194]">The source filename is retained by default. Change it only if you want a different download name.</span></label>}</div></section>}</main></SiteShell>;
}
