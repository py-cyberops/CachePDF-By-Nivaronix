/**
 * CachePDF Design Note: The trust control makes local processing observable. It uses factual,
 * compact evidence—not security theater—to support the Technical Trust Ledger visual system.
 */
import { Info, Radio, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { cachepdfAssets } from "@/lib/cachepdfAssets";

export default function LocalSessionTrust({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const markReady = () => setOfflineReady(true);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("cachepdf-offline-ready", markReady);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.ready.then(markReady).catch(() => undefined);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); window.removeEventListener("cachepdf-offline-ready", markReady); };
  }, []);
  return <>
    <button type="button" onClick={() => setOpen(true)} className={`local-session-control ${compact ? "local-session-compact" : ""}`} aria-haspopup="dialog" aria-label="Open local session trust details">
      <span className="status-dot" /> <span>{compact ? "LOCAL" : "LOCAL SESSION"}</span>
    </button>
    {open && <div className="fixed inset-0 z-[70] flex items-end bg-[#040609]/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center" role="presentation" onMouseDown={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="local-session-title" className="surface w-full max-w-[460px] p-5 shadow-[0_28px_80px_rgba(0,0,0,.5)] sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-5"><div className="flex items-start gap-3"><img src={cachepdfAssets.monogramCyanAlt} alt="" className="h-8 w-8" /><div><p className="section-kicker"><span className="status-dot" /> Local session</p><h2 id="local-session-title" className="mt-4 font-display text-2xl font-semibold tracking-[-0.05em] text-white">Local processing</h2></div></div><button className="icon-button-small" onClick={() => setOpen(false)} aria-label="Close trust details"><X className="h-4 w-4" /></button></div>
        <p className="mt-4 text-sm leading-6 text-[#9eabbc]">Your document is processed within this browser session for supported local workflows.</p>
        <dl className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">{[["Document upload", "None"], ["Server-side document processing", "None"], ["Account required", "No"], ["Original modified", "No"], ["App shell", offlineReady ? (online ? "Offline ready" : "Running offline") : "Preparing local cache"]].map(([term, detail]) => <div className="flex items-center justify-between gap-6 py-3" key={term}><dt className="text-sm text-[#8491a3]">{term}</dt><dd className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#70dff8]">{term === "App shell" && (online ? <Radio className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />)}{detail}</dd></div>)}</dl>
        <div className="mt-5 flex gap-3 rounded-[10px] border border-[#05c8f6]/20 bg-[#05c8f6]/[0.05] p-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" /><p className="text-xs leading-5 text-[#9ed7e6]">{offlineReady ? "The CachePDF app shell is cached after this visit. OCR language data must be loaded before offline OCR can continue. " : "The app shell is preparing its local cache. "}Your PDF contents are not sent to CachePDF for supported local processing.</p></div>
        <Link href="/privacy" onClick={() => setOpen(false)} className="button-secondary mt-6">How CachePDF works →</Link>
      </section>
    </div>}
  </>;
}
