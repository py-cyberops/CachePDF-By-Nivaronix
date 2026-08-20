import DensityControl from "@/components/DensityControl";
import SiteShell from "@/components/SiteShell";
import { defaultOutputName, requestedDownloadName } from "@/lib/outputNames";
import { cleanupPdfPrivacy, inspectPdfPrivacy, type PrivacyCleanupSelection, type PrivacyFinding } from "@/lib/privacyInspector";
import { trackCachePdfEvent } from "@/lib/telemetry";
import { PDFDocument } from "pdf-lib";
import { AlertTriangle, ArrowLeft, CheckCircle2, Check, Download, FileCheck2, FilePlus2, FolderOpen, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type Result = { bytes: Uint8Array; name: string };
const blankSelection: PrivacyCleanupSelection = { metadata: false, "form-fields": false, annotations: false, "embedded-files": false, "document-actions": false };

export default function PrivacyCheckWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [findings, setFindings] = useState<PrivacyFinding[]>([]);
  const [selection, setSelection] = useState<PrivacyCleanupSelection>(blankSelection);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [downloadName, setDownloadName] = useState("");

  function resetOutput() { setResult(null); setDownloadName(""); }
  async function openFile(candidate?: File) {
    if (!candidate) return;
    const extension = candidate.name.toLowerCase().split(".").pop();
    if (candidate.type !== "application/pdf" && extension !== "pdf") { toast.error("Choose a PDF file for the privacy check."); return; }
    try {
      const document = await PDFDocument.load(await candidate.arrayBuffer(), { updateMetadata: false });
      const nextFindings = inspectPdfPrivacy(document);
      const selected = nextFindings.reduce<PrivacyCleanupSelection>((current, finding) => ({ ...current, [finding.id]: finding.detected && finding.cleanupSupported }), { ...blankSelection });
      setFile(candidate); setFindings(nextFindings); setSelection(selected); resetOutput();
      trackCachePdfEvent("workbench_opened", { tool: "document-privacy-check" }); toast.success("Privacy check completed locally.");
    } catch { toast.error("This PDF could not be inspected. The source file remains unchanged."); }
  }
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { void openFile(event.target.files?.[0]); event.target.value = ""; };
  async function cleanOutput() {
    if (!file) return;
    if (!Object.values(selection).some(Boolean)) { toast.message("Select at least one supported cleanup action."); return; }
    setBusy(true); resetOutput(); trackCachePdfEvent("operation_started", { tool: "document-privacy-check" });
    try {
      const document = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false }); cleanupPdfPrivacy(document, selection);
      const next = { bytes: await document.save(), name: defaultOutputName(file.name, "pdf") };
      setResult(next); setDownloadName(next.name); trackCachePdfEvent("operation_completed", { tool: "document-privacy-check", output: "pdf" }); toast.success("New cleaned PDF created locally.");
    } catch { trackCachePdfEvent("operation_failed", { tool: "document-privacy-check" }); toast.error("The selected cleanup actions could not complete. Your source file remains unchanged."); }
    finally { setBusy(false); }
  }
  function download() {
    if (!result) return;
    const copy = new Uint8Array(result.bytes.byteLength); copy.set(result.bytes);
    const url = URL.createObjectURL(new Blob([copy.buffer], { type: "application/pdf" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = requestedDownloadName(downloadName, result.name); document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 350); trackCachePdfEvent("export_completed", { output: "pdf" });
  }

  return <SiteShell><main className="bg-[#07090d]">
    <section className="border-b border-white/[.08] bg-[#090c11]"><div className="container py-8 md:py-12">
      <Link href="/tools" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[#7fe3f9]"><ArrowLeft className="h-3.5 w-3.5" /> CachePDF workbench</Link>
      <div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="section-kicker">Clean · local privacy review</div><h1 className="mt-5 font-display text-4xl font-semibold tracking-[-.065em] text-white sm:text-5xl">Document Privacy Check.</h1><p className="mt-4 max-w-2xl leading-7 text-[#9da9ba]">Review selected common document traces locally, decide which supported cleanup actions to apply, and export a separate PDF. This is an educational check, not a guarantee of suitability or a complete security audit.</p></div><DensityControl compact /></div>
    </div></section>
    <section className="container grid gap-7 py-10 lg:grid-cols-[minmax(0,1fr)_310px] lg:py-14"><div className="surface p-5 sm:p-7">
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFileChange} />
      {!file ? <div className="drop-zone"><span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#05c8f6]/25 bg-[#05c8f6]/10 text-[#05c8f6]"><UploadCloud className="h-6 w-6" /></span><h2 className="mt-5 font-display text-xl font-medium text-white">Open a PDF for a local check</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#8794a6]">CachePDF checks selected common structures in this browser. It does not upload the document to a CachePDF processing server.</p><button type="button" onClick={() => inputRef.current?.click()} className="button-secondary mt-6">Choose PDF <FolderOpen className="h-4 w-4" /></button></div> : <div>
        <div className="flex items-start justify-between gap-4 border-b border-white/[.08] pb-6"><div><p className="font-display text-lg font-medium text-white">{file.name}</p><p className="mt-1 text-sm text-[#8794a6]">Local findings only · choose cleanup actions explicitly</p></div><button type="button" className="button-ghost text-sm text-[#7adff7]" onClick={() => inputRef.current?.click()}><FilePlus2 className="h-4 w-4" /> Replace</button></div>
        <div className="mt-7 space-y-3">{findings.map((finding) => {
          const selected = selection[finding.id];
          return <div key={finding.id} className={`rounded-[12px] border p-4 ${finding.detected ? "border-amber-300/25 bg-amber-300/[.04]" : "border-white/[.1] bg-white/[.02]"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${finding.detected ? "bg-amber-300/15 text-amber-200" : "bg-[#05c8f6]/10 text-[#05c8f6]"}`}>{finding.detected ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-medium text-white">{finding.label}</h2><p className="mt-1 text-sm leading-6 text-[#8895a7]">{finding.detail}</p></div>{finding.cleanupSupported && finding.detected && <button type="button" role="checkbox" aria-checked={selected} onClick={() => { setSelection((current) => ({ ...current, [finding.id]: !current[finding.id] })); resetOutput(); }} className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${selected ? "border-[#05c8f6]/60 bg-[#05c8f6]/10 text-[#bceefa]" : "border-white/[.16] bg-white/[.03] text-[#bbdce5]"}`}><span aria-hidden="true" className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${selected ? "border-[#05c8f6] bg-[#05c8f6] text-[#071118]" : "border-current"}`}>{selected && <Check className="h-3 w-3" />}</span>Clean in new PDF</button>}</div></div></div></div>;
        })}</div>
      </div>}
    </div><aside className="space-y-4"><div className="surface-quiet p-5"><ShieldCheck className="h-5 w-5 text-[#05c8f6]" /><h2 className="mt-4 font-display text-lg font-medium text-white">Bounded findings</h2><p className="mt-2 text-sm leading-6 text-[#8794a6]">This check covers common metadata, form fields, annotations, embedded-file references, and document actions. It does not detect every possible trace or make a sharing decision for you.</p></div><div className="surface-quiet p-5"><Sparkles className="h-5 w-5 text-[#05c8f6]" /><h2 className="mt-4 font-display text-lg font-medium text-white">Safe cleanup</h2><p className="mt-2 text-sm leading-6 text-[#8794a6]">Selected cleanup steps create a new output. Keep or discard the source file yourself after reviewing the result.</p></div></aside></section>
    {file && <section className="container pb-14"><div className="rounded-[16px] border border-white/[.1] bg-[#0b1017] p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-display text-lg font-medium text-white">{result ? "Cleaned PDF ready to export" : busy ? "Creating cleaned PDF locally" : "Choose supported cleanup actions"}</p><p className="mt-1 text-sm text-[#8d99aa]">{result ? "Review the new PDF before sharing it." : "No action modifies the selected source file."}</p></div>{result ? <button type="button" onClick={download} className="button-primary"><Download className="h-4 w-4" /> Export cleaned PDF</button> : <button type="button" onClick={() => void cleanOutput()} disabled={busy} className="button-primary"><FileCheck2 className="h-4 w-4" /> {busy ? "Cleaning" : "Create cleaned PDF"}</button>}</div>{result && <label className="mt-5 block max-w-xl"><span className="field-label">Export filename</span><input value={downloadName} onChange={(event) => setDownloadName(event.target.value)} className="field-input mt-2" aria-label="Cleaned PDF export filename" /><span className="mt-2 block text-xs leading-5 text-[#748194]">The source filename is retained by default. Change it only if you want a different download name.</span></label>}</div></section>}
  </main></SiteShell>;
}
