/**
 * OnePDF Design Note: The workbench makes document state legible through a controlled local
 * processing rail, explicit file metadata, and only supported browser-native PDF operations.
 */
import SiteShell from "@/components/SiteShell";
import { ToolGlyph } from "@/components/ToolGlyph";
import { getTool, type ToolDefinition } from "@/lib/toolData";
import { PDFDocument, degrees, rgb, type PDFPage } from "pdf-lib";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Download, FilePlus2, FileText, FolderOpen, GripVertical, Image as ImageIcon, Info, LoaderCircle, LockKeyhole, RotateCw, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

type LoadedFile = { file: File; name: string; size: number; pages?: number; kind: "pdf" | "image" };
type Result = { bytes: Uint8Array; name: string };

const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function parsePages(raw: string, total: number) {
  if (!raw.trim() || raw.trim().toLowerCase() === "all") return Array.from({ length: total }, (_, index) => index + 1);
  const pages: number[] = [];
  raw.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const [startText, endText] = part.split("-").map((value) => value.trim());
    const start = Number(startText); const end = endText ? Number(endText) : start;
    if (!Number.isInteger(start) || !Number.isInteger(end)) throw new Error("Use page numbers like 1, 3-5, or 8.");
    const lower = Math.max(1, Math.min(start, end)); const upper = Math.min(total, Math.max(start, end));
    for (let page = lower; page <= upper; page += 1) pages.push(page);
  });
  return pages;
}

function saveDownload(result: Result) {
  const url = URL.createObjectURL(new Blob([result.bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 300);
}

function stateCopy(tool: ToolDefinition) {
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
  const [pageRule, setPageRule] = useState("all");
  const [rotation, setRotation] = useState("90");
  const [watermark, setWatermark] = useState("CONFIDENTIAL");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!tool) return <UnknownTool />;
  const mode = stateCopy(tool);
  const needsImages = tool.slug === "images-to-pdf";
  const isMerge = tool.slug === "merge-pdf";
  const isImplemented = tool.state === "implemented";
  const primaryFile = files[0];
  const enoughFiles = isMerge ? files.length >= 2 : files.length >= 1;

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
        catch { toast.error(`${file.name} could not be opened as a PDF.`); continue; }
      }
      accepted.push(record);
    }
    if (!accepted.length) return;
    setFiles((current) => (isMerge || needsImages ? [...current, ...accepted] : [accepted[0]])); setResult(null); setReport([]);
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void ingest(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files) void ingest(event.dataTransfer.files); };
  const removeFile = (index: number) => { setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index)); setResult(null); setReport([]); };
  const moveFile = (index: number, direction: -1 | 1) => { setFiles((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }); };

  async function makeImagePdf() {
    const document = await PDFDocument.create();
    for (const record of files) {
      const bytes = await record.file.arrayBuffer(); const lower = record.name.toLowerCase();
      const image = lower.endsWith(".png") || record.file.type === "image/png" ? await document.embedPng(bytes) : await document.embedJpg(bytes);
      const scale = Math.min(1, 1440 / Math.max(image.width, image.height)); const width = image.width * scale; const height = image.height * scale;
      const page = document.addPage([width, height]); page.drawImage(image, { x: 0, y: 0, width, height });
    }
    return { bytes: await document.save(), name: "onepdf-images.pdf" };
  }

  function drawPageNumber(page: PDFPage, number: number) { const { width } = page.getSize(); page.drawText(String(number), { x: width - 42, y: 20, size: 10, color: rgb(0.17, 0.22, 0.28), opacity: 0.85 }); }
  function drawWatermark(page: PDFPage, text: string) { const { width, height } = page.getSize(); const size = Math.max(18, Math.min(width / 7, 44)); page.drawText(text, { x: width * 0.12, y: height * 0.48, size, color: rgb(0.05, 0.56, 0.72), opacity: 0.2, rotate: degrees(35) }); }

  async function runTool() {
    const activeTool = tool;
    if (!activeTool) return;
    if (!isImplemented) { toast.message("This engine is not enabled yet", { description: "OnePDF keeps the workspace visible but does not claim processing support before it is ready." }); return; }
    if (!enoughFiles) { toast.error(isMerge ? "Add at least two PDF files to merge." : "Add a file to continue."); return; }
    setBusy(true); setResult(null); setReport([]);
    try {
      if (needsImages) { setResult(await makeImagePdf()); toast.success("Your PDF is ready."); return; }
      if (isMerge) {
        const output = await PDFDocument.create();
        for (const record of files) { const source = await PDFDocument.load(await record.file.arrayBuffer()); const copied = await output.copyPages(source, source.getPageIndices()); copied.forEach((page) => output.addPage(page)); }
        setResult({ bytes: await output.save(), name: "onepdf-merged.pdf" }); toast.success("Your PDF is ready."); return;
      }
      if (!primaryFile) return;
      const source = await PDFDocument.load(await primaryFile.file.arrayBuffer()); const total = source.getPageCount(); const selection = parsePages(pageRule, total);
      if (activeTool.slug === "pdf-privacy-scanner") {
        const fields = [["Title", source.getTitle()], ["Author", source.getAuthor()], ["Subject", source.getSubject()], ["Keywords", source.getKeywords()], ["Creator", source.getCreator()], ["Producer", source.getProducer()], ["Created", source.getCreationDate()?.toLocaleString()], ["Modified", source.getModificationDate()?.toLocaleString()]];
        const present = fields.filter(([, value]) => Boolean(value)).map(([label, value]) => `${label}: ${value}`);
        setReport(present.length ? present : ["No common document metadata fields were found in this PDF."]); toast.success("Local metadata scan complete."); return;
      }
      let output: Result;
      if (activeTool.slug === "split-pdf" || activeTool.slug === "extract-pages") {
        const next = await PDFDocument.create(); const copied = await next.copyPages(source, selection.map((page) => page - 1)); copied.forEach((page) => next.addPage(page)); output = { bytes: await next.save(), name: activeTool.slug === "split-pdf" ? "onepdf-split.pdf" : "onepdf-extracted-pages.pdf" };
      } else if (activeTool.slug === "reorder-pages") {
        const next = await PDFDocument.create(); const copied = await next.copyPages(source, selection.map((page) => page - 1)); copied.forEach((page) => next.addPage(page)); output = { bytes: await next.save(), name: "onepdf-reordered.pdf" };
      } else if (activeTool.slug === "delete-pages") {
        Array.from(new Set(selection)).sort((a, b) => b - a).forEach((page) => source.removePage(page - 1)); output = { bytes: await source.save(), name: "onepdf-pages-deleted.pdf" };
      } else if (activeTool.slug === "rotate-pages") {
        source.getPages().forEach((page, index) => { if (selection.includes(index + 1)) page.setRotation(degrees((page.getRotation().angle + Number(rotation)) % 360)); }); output = { bytes: await source.save(), name: "onepdf-rotated.pdf" };
      } else if (activeTool.slug === "add-page-numbers") {
        source.getPages().forEach((page, index) => drawPageNumber(page, index + 1)); output = { bytes: await source.save(), name: "onepdf-numbered.pdf" };
      } else if (activeTool.slug === "add-watermark") {
        if (!watermark.trim()) throw new Error("Enter watermark text before processing."); source.getPages().forEach((page) => drawWatermark(page, watermark.trim())); output = { bytes: await source.save(), name: "onepdf-watermarked.pdf" };
      } else if (activeTool.slug === "remove-pdf-metadata") {
        source.setTitle(""); source.setAuthor(""); source.setSubject(""); source.setKeywords([]); source.setCreator(""); source.setProducer(""); output = { bytes: await source.save(), name: "onepdf-metadata-removed.pdf" };
      } else { throw new Error("This local operation has not been configured."); }
      setResult(output); toast.success("Your PDF is ready.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "This file could not be processed."); }
    finally { setBusy(false); }
  }

  const pageHint = tool.slug === "reorder-pages" ? "Example: 3,1,2,4" : tool.slug === "delete-pages" ? "Pages to remove, e.g. 2, 5-7" : "Pages to use, e.g. 1-3, 5";
  const hasPageRule = ["split-pdf", "extract-pages", "reorder-pages", "delete-pages", "rotate-pages"].includes(tool.slug);

  return (
    <SiteShell>
      <main className="bg-[#07090d]">
        <section className="border-b border-white/[0.08] bg-[#090c11]">
          <div className="container py-7">
            <Link href="/tools" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7fe3f9] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> All PDF tools</Link>
            <div className="mt-7 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div className="section-kicker">{tool.category}</div>
                <div className="mt-5 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#82e7fb]"><ToolGlyph name={tool.icon} className="h-6 w-6" /></span><div><h1 className="font-display text-4xl font-semibold tracking-[-0.065em] text-white sm:text-5xl">{tool.name}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#9da9ba]">{tool.description}</p></div></div>
              </div>
              <div className={`mode-badge mode-${mode.tone}`}><LockKeyhole className="h-4 w-4" /><div><p>{mode.label}</p><span>{mode.text}</span></div></div>
            </div>
          </div>
        </section>
        <section className="container grid gap-7 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14">
          <div className="surface overflow-hidden">
            <div className="border-b border-white/[0.09] px-5 py-4 sm:px-7"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7b2c1]">01 // Select document</p></div>
            <div className="p-5 sm:p-7">
              <input ref={inputRef} type="file" className="hidden" accept={needsImages ? "image/png,image/jpeg,.png,.jpg,.jpeg" : "application/pdf,.pdf"} multiple={isMerge || needsImages} onChange={onFileChange} />
              {!files.length ? (
                <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`drop-zone ${dragging ? "drop-zone-active" : ""}`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#05c8f6]"><UploadCloud className="h-6 w-6" /></span>
                  <h2 className="mt-5 font-display text-xl font-medium tracking-[-0.04em] text-white">{needsImages ? "Drop PNG or JPG images here" : isMerge ? "Drop PDF files here" : "Drop a PDF here"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#8794a6]">{needsImages ? "Create a PDF without sending image files away." : "Choose a file from this device. The original stays untouched."}</p>
                  <button type="button" onClick={() => inputRef.current?.click()} className="button-secondary mt-6">Browse files <FolderOpen className="h-4 w-4" /></button>
                  <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#697588]">Up to 100 MB per file · {needsImages ? "PNG / JPG" : "PDF"}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4"><div><p className="font-display text-lg font-medium tracking-[-0.04em] text-white">{files.length} {files.length === 1 ? "file selected" : "files selected"}</p><p className="mt-1 text-sm text-[#8794a6]">{isMerge ? "Use the arrows to set document order." : needsImages ? "Images are included in the displayed order." : "Review the controls before running the tool."}</p></div><button type="button" onClick={() => inputRef.current?.click()} className="button-ghost text-sm text-[#7adff7]"><FilePlus2 className="h-4 w-4" /> Add {isMerge || needsImages ? "files" : "file"}</button></div>
                  <div className="mt-6 space-y-2">
                    {files.map((file, index) => <div className="file-row" key={`${file.name}-${index}`}><span className="text-[#697689]"><GripVertical className="h-4 w-4" /></span><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.1] bg-[#0a0e14] text-[#8ee7fb]">{file.kind === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#e4ebf3]">{file.name}</p><p className="mt-0.5 font-mono text-[10px] text-[#7b8798]">{formatBytes(file.size)}{file.pages ? ` · ${file.pages} ${file.pages === 1 ? "page" : "pages"}` : ""}</p></div>{(isMerge || needsImages) && <div className="hidden items-center gap-1 sm:flex"><button className="icon-button-small" onClick={() => moveFile(index, -1)} disabled={index === 0} aria-label="Move file up"><ArrowUp className="h-3.5 w-3.5" /></button><button className="icon-button-small" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} aria-label="Move file down"><ArrowDown className="h-3.5 w-3.5" /></button></div>}<button className="icon-button-small text-[#f3a1a1] hover:border-[#ef8585]/50" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}
                  </div>
                </>
              )}
              {files.length > 0 && <div className="mt-8 border-t border-white/[0.09] pt-7"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7b2c1]">02 // Configure operation</p>{hasPageRule && <label className="mt-5 block"><span className="field-label">{tool.slug === "delete-pages" ? "Pages to delete" : tool.slug === "reorder-pages" ? "New page order" : "Pages"}</span><input value={pageRule} onChange={(event) => setPageRule(event.target.value)} className="field-input mt-2" placeholder={pageHint} /><span className="mt-2 block text-xs leading-5 text-[#748194]">{pageHint}. Leave as “all” to use every page.</span></label>}{tool.slug === "rotate-pages" && <label className="mt-5 block"><span className="field-label">Rotation</span><select value={rotation} onChange={(event) => setRotation(event.target.value)} className="field-input mt-2"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label>}{tool.slug === "add-watermark" && <label className="mt-5 block"><span className="field-label">Watermark text</span><input value={watermark} onChange={(event) => setWatermark(event.target.value)} className="field-input mt-2" maxLength={40} /><span className="mt-2 block text-xs leading-5 text-[#748194]">OnePDF draws a light diagonal text watermark onto the new file.</span></label>}{tool.slug === "add-page-numbers" && <p className="mt-5 rounded-[10px] border border-white/[0.1] bg-[#0a0e14] p-4 text-sm leading-6 text-[#9aa6b7]">Page numbers are drawn at the lower-right of every page in a new document copy.</p>}{tool.slug === "remove-pdf-metadata" && <p className="mt-5 rounded-[10px] border border-white/[0.1] bg-[#0a0e14] p-4 text-sm leading-6 text-[#9aa6b7]">This removes common document fields such as title, author, subject, keywords, creator, and producer from the new file.</p>}</div>}
            </div>
          </div>
          <aside className="space-y-4"><div className="surface-quiet p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8793a5]">Processing status</p><div className="mt-5 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#05c8f6]/10 text-[#05c8f6]"><ShieldCheck className="h-4 w-4" /></span><div><p className="text-sm font-medium text-[#e3eaf2]">{mode.label}</p><p className="mt-1 text-xs leading-5 text-[#8491a3]">{mode.text}</p></div></div></div><div className="surface-quiet p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8793a5]">Original file</p><p className="mt-4 text-sm leading-6 text-[#a5b0c0]">Every completed operation generates a fresh output. OnePDF does not overwrite your selected source document.</p></div><div className="rounded-[14px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.055] p-5"><div className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="text-xs leading-5 text-[#a5ddeb]">For sensitive files, download the result to a secure location and remove local copies only when appropriate for your workflow.</p></div></div></aside>
        </section>
        {files.length > 0 && <section className="container pb-14"><div className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/[0.1] bg-[#0b1017] p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="font-display text-lg font-medium tracking-[-0.04em] text-white">{result ? "Your PDF is ready" : report.length ? "Local scan complete" : "Ready to process"}</p><p className="mt-1 text-sm text-[#8d99aa]">{result ? "Download the new PDF when you are ready." : report.length ? "Review the fields detected in this document." : isImplemented ? "Run this operation in your browser." : "The file is staged, but this processing engine is not enabled yet."}</p></div>{result ? <div className="flex gap-3"><button onClick={() => { setFiles([]); setResult(null); setReport([]); }} className="button-secondary">Process another</button><button onClick={() => saveDownload(result)} className="button-primary"><Download className="h-4 w-4" /> Download PDF</button></div> : <button onClick={() => void runTool()} disabled={busy || !enoughFiles} className="button-primary justify-center disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Processing</> : isImplemented ? <><RotateCw className="h-4 w-4" /> {tool.name}</> : "Engine coming soon"}</button>}</div>{report.length > 0 && <div className="mt-4 rounded-[14px] border border-white/[0.1] bg-[#0a0e14] p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#05c8f6]" /><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b6c1d0]">Metadata report</p></div><div className="mt-4 divide-y divide-white/[0.08]">{report.map((line) => { const [label, ...value] = line.split(": "); return <div className="flex gap-4 py-3 text-sm" key={line}><span className="w-20 shrink-0 text-[#7f8d9f]">{label}</span><span className="break-all text-[#dce5ed]">{value.join(": ") || "None found"}</span></div>; })}</div><Link href="/tools/remove-pdf-metadata" className="button-secondary mt-5">Create a metadata-cleaned copy <ArrowRight className="h-4 w-4" /></Link></div>}</section>}
      </main>
    </SiteShell>
  );
}

function UnknownTool() {
  return <SiteShell><main className="container flex min-h-[55vh] flex-col justify-center py-20"><div className="section-kicker">Tool unavailable</div><h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.07em] text-white">This workspace is not on the roster.</h1><p className="mt-5 max-w-lg leading-7 text-[#98a5b5]">The route may have moved, or the requested document utility is not currently listed.</p><Link href="/tools" className="button-primary mt-8 w-fit">View PDF tools <ArrowLeft className="h-4 w-4" /></Link></main></SiteShell>;
}
