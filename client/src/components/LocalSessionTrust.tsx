/**
 * CachePDF Design Note: The trust control makes local processing observable. It uses factual,
 * compact evidence—not security theater—to support the Technical Trust Ledger visual system.
 */
import { Info, Radio, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { cachepdfAssets } from "@/lib/cachepdfAssets";

export default function LocalSessionTrust({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [appShellReady, setAppShellReady] = useState(false);
  const [online, setOnline] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const closeDialog = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const checkAppShell = async () => {
      try {
        const cached = await caches.match(new URL("/index.html", window.location.origin).href);
        setAppShellReady(Boolean(cached));
      } catch { setAppShellReady(false); }
    };
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("cachepdf-offline-ready", checkAppShell);
    void checkAppShell();
    if ("serviceWorker" in navigator) void navigator.serviceWorker.ready.then(checkAppShell).catch(() => undefined);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); window.removeEventListener("cachepdf-offline-ready", checkAppShell); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const frame = window.requestAnimationFrame(() => (dialog.querySelector<HTMLElement>("[data-dialog-autofocus]") ?? dialog).focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeDialog(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const appShellDetail = appShellReady ? (online ? "Offline ready" : "Running offline") : online ? "Caching after this visit" : "Not cached";
  const trustRows = [["Document content", "Local"], ["Server document processing", "None"], ["Account required", "No"], ["Original file", "Unchanged"], ["App shell", appShellDetail], ["OCR language data", "Network may be required"]] as const;

  return <>
    <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={`local-session-control ${compact ? "local-session-compact" : ""}`} aria-haspopup="dialog" aria-expanded={open} aria-controls="local-session-dialog" aria-label="Open local session trust details">
      <span className="status-dot" /> <span>{compact ? "LOCAL" : "LOCAL SESSION"}</span>
    </button>
    {open && createPortal(<div className="local-session-overlay fixed inset-0 z-[100] flex items-end bg-[#040609]/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5" role="presentation" onMouseDown={closeDialog}>
      <section ref={dialogRef} id="local-session-dialog" role="dialog" aria-modal="true" aria-labelledby="local-session-title" aria-describedby="local-session-description" tabIndex={-1} className="surface local-session-modal w-full max-w-[460px] overflow-y-auto p-5 shadow-[0_28px_80px_rgba(0,0,0,.5)] sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-5"><div className="flex min-w-0 items-start gap-3"><img src={cachepdfAssets.monogramCyanAlt} alt="" className="h-8 w-8 shrink-0" /><div className="min-w-0"><p className="section-kicker"><span className="status-dot" /> Local session</p><h2 id="local-session-title" className="mt-4 font-display text-2xl font-semibold tracking-[-0.05em] text-white">Local processing</h2></div></div><button data-dialog-autofocus className="icon-button-small shrink-0" onClick={closeDialog} aria-label="Close trust details"><X className="h-4 w-4" /></button></div>
        <p id="local-session-description" className="mt-4 text-sm leading-6 text-[#9eabbc]">Your selected document contents are not sent to CachePDF for supported browser-local processing.</p>
        <dl className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">{trustRows.map(([term, detail]) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3" key={term}><dt className="min-w-0 text-sm text-[#8491a3]">{term}</dt><dd className="flex min-w-0 items-center justify-end gap-1.5 break-words text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[#70dff8]">{term === "App shell" && (online ? <Radio className="h-3 w-3 shrink-0" /> : <WifiOff className="h-3 w-3 shrink-0" />)}{detail}</dd></div>)}</dl>
        <div className="mt-5 flex min-w-0 gap-3 rounded-[10px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.05] p-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="min-w-0 text-xs leading-5 text-[#9ed7e6]">{appShellReady ? "The app shell is cached for offline reuse after this visit. " : "The app shell is not yet verified as cached. "}OCR runs in a browser worker, but English language data may require network access before OCR can work offline.</p></div>
        <Link href="/privacy" onClick={closeDialog} className="button-secondary mt-6">How CachePDF works →</Link>
      </section>
    </div>, document.body)}
  </>;
}
