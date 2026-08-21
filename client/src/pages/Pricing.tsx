import SiteShell from "@/components/SiteShell";
import { getCachePdfProProduct, getCachePdfProStatus, isAndroidStoreBuild, purchaseCachePdfPro, restoreCachePdfPro } from "@/lib/cachePdfPro";
import { ArrowRight, Check, FileOutput, LoaderCircle, LockKeyhole, ServerOff, UserRoundX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const localBoundary = [
  { label: "Document upload", value: "None", icon: ServerOff },
  { label: "Server-side processing", value: "None", icon: LockKeyhole },
  { label: "Account required", value: "No", icon: UserRoundX },
  { label: "Original overwrite", value: "No", icon: FileOutput },
];

export default function Pricing() {
  const android = isAndroidStoreBuild();
  const [entitled, setEntitled] = useState(false);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!android) return;
    void Promise.all([getCachePdfProStatus(), getCachePdfProProduct()])
      .then(([status, product]) => { setEntitled(status.entitled); setPrice(product.price); })
      .catch(() => undefined);
  }, [android]);

  async function buy() {
    setBusy(true);
    try {
      const result = await purchaseCachePdfPro();
      setEntitled(result.entitled);
      toast.success(result.state === "purchased" ? "CachePDF Pro is now active." : result.state === "pending" ? "Your Google Play purchase is pending." : "Purchase cancelled.");
    } catch {
      toast.error("Google Play could not complete this purchase.");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    try {
      const result = await restoreCachePdfPro();
      setEntitled(result.entitled);
      toast.success(result.entitled ? "CachePDF Pro restored." : "No CachePDF Pro purchase was found for this Google Play account.");
    } catch {
      toast.error("Purchases could not be restored right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main>
        <section className="border-b border-white/[0.08] bg-[#090c11]">
          <div className="container grid gap-10 py-14 md:grid-cols-[minmax(0,1fr)_390px] md:items-end md:py-20">
            <div>
              <div className="section-kicker">{android ? "Android local access" : "Local access policy"}</div>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.93] tracking-[-0.07em] text-white sm:text-6xl">
                {android ? "Advanced local workflows. Pay once." : "The local workbench stays open."}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9da9ba]">
                {android
                  ? "CachePDF Pro is a one-time Google Play purchase. No CachePDF account and no document cloud are required."
                  : "Supported browser-local workflows are free to use. CachePDF does not require an account, subscription, or document upload."}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#05c8f6]/20 bg-[#071019] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#70dff8]">Local session · policy trace</p>
              <dl className="mt-4 divide-y divide-white/[0.08]">
                {localBoundary.map(({ label, value, icon: Icon }) => (
                  <div className="flex items-center justify-between gap-4 py-3" key={label}>
                    <dt className="flex items-center gap-2 text-xs text-[#9da9ba]"><Icon className="h-3.5 w-3.5 text-[#05c8f6]" />{label}</dt>
                    <dd className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#c7f4ff]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className={`container grid gap-6 py-12 md:py-16 ${android ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"}`}>
          <article className="rounded-[18px] border border-[#05c8f6]/35 bg-[#0b141d] p-7 sm:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#70dff8]">CachePDF Free · access statement</p>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.055em] text-white">PDF essentials stay free.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa6b7]">Organize, convert, mark, read, clean, and export supported PDF workflows on this device. Every completed action produces a separate output.</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {["No account or subscription", "Original-safe local outputs", "Core PDF tools and basic OCR", "No workbench advertising"].map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm text-[#dce5ee]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#05c8f6]" />{bullet}</li>
              ))}
            </ul>
            <Link href="/tools" className="button-primary mt-9 tracking-[0.08em]">OPEN PDF <ArrowRight className="h-4 w-4" /></Link>
          </article>

          {android ? (
            <article className="rounded-[18px] border border-amber-300/35 bg-amber-300/[.06] p-7 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200">CachePDF Pro · device entitlement</p>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.055em] text-white">{entitled ? "Pro is active" : price || "One-time purchase"}</h2>
              <p className="mt-3 text-sm leading-6 text-[#f4e2bc]">Unlock advanced local productivity as the workflows are completed: searchable OCR PDFs, advanced compression, batch actions, advanced privacy controls, and workflow presets.</p>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[.14em] text-amber-100/80">Google Play entitlement · no CachePDF account · documents remain on device</p>
              {entitled ? (
                <Link href="/tools" className="button-primary mt-8">OPEN PRO WORKFLOWS <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" className="button-primary" disabled={busy} onClick={() => void buy()}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" />} UNLOCK PRO</button>
                  <button type="button" className="button-secondary" disabled={busy} onClick={() => void restore()}>RESTORE PURCHASE</button>
                </div>
              )}
            </article>
          ) : (
            <article className="rounded-[18px] border border-white/[0.1] bg-[#090e14] p-7 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9cb5bf]">Product boundary</p>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.055em] text-white">Open. Work locally. Export.</h2>
              <p className="mt-3 text-sm leading-6 text-[#9aa6b7]">Optional support helps maintain the project, but is never required to process a document. Sponsorship discussions stay outside the document workbench.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/support" className="button-secondary">SUPPORT CACHEPDF <ArrowRight className="h-4 w-4" /></Link><Link href="/advertise" className="button-secondary">SPONSORSHIP POLICY <ArrowRight className="h-4 w-4" /></Link></div>
            </article>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
