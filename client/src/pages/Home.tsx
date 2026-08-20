/**
 * OnePDF Design Note: Home is an asymmetric Technical Trust Ledger landing page. It places
 * document privacy evidence and an actionable workbench beside—not below—the main message.
 */
import SiteShell from "@/components/SiteShell";
import { ToolGlyph } from "@/components/ToolGlyph";
import { ArrowRight, Check, ChevronRight, FileUp, LockKeyhole, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";

const featuredTools = [
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine files, in order.", icon: "merge" },
  { slug: "split-pdf", name: "Split PDF", description: "Extract the pages you need.", icon: "split" },
  { slug: "images-to-pdf", name: "Images → PDF", description: "Make a document from images.", icon: "images" },
  { slug: "remove-pdf-metadata", name: "Remove Metadata", description: "Create a cleaner delivery copy.", icon: "metadata" },
  { slug: "add-page-numbers", name: "Page Numbers", description: "Finish a document with context.", icon: "numbers" },
  { slug: "add-watermark", name: "Watermark", description: "Mark a document without leaving your browser.", icon: "watermark" },
];

const trustItems = ["No account required", "Browser-first processing", "Privacy-focused", "Free core tools"];

export default function Home() {
  return (
    <SiteShell>
      <main>
        <section className="relative overflow-hidden border-b border-white/[0.08]">
          <div className="absolute inset-0 grid-fade" aria-hidden="true" />
          <div className="container relative grid min-h-[660px] items-center gap-12 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:py-20 xl:min-h-[700px]">
            <div className="relative z-10 max-w-xl">
              <div className="section-kicker"><span className="status-dot" /> Browser-first PDF workbench</div>
              <h1 className="mt-6 font-display text-[clamp(3.1rem,6.3vw,6.15rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-white">
                Your files <br />
                <span className="text-[#05c8f6]">stay in the workbench.</span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-[#a7b0bf] sm:text-lg">Merge, split, rotate, number and clean PDFs. Process files locally whenever the browser can do the work.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/tools" className="button-primary justify-center">Explore PDF tools <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/privacy" className="button-secondary justify-center">How privacy works <ChevronRight className="h-4 w-4" /></Link>
              </div>
              <div className="mt-10 grid gap-x-5 gap-y-3 border-t border-white/[0.09] pt-7 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-[#d4dbe5]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#05c8f6]/10 text-[#05c8f6]"><Check className="h-3 w-3" strokeWidth={2.5} /></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[680px] lg:justify-self-end">
              <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#05c8f6]/10 blur-[110px]" aria-hidden="true" />
              <div className="surface relative overflow-hidden p-3 shadow-[0_28px_100px_rgba(0,0,0,0.48)] sm:p-5">
                <img src="/manus-storage/onepdf-hero-local-processing_23f33107.png" alt="Abstract local PDF processing visual" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
                <div className="relative rounded-[14px] border border-white/[0.1] bg-[#0a0e15]/92 p-4 backdrop-blur-md sm:p-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#05c8f6]/12 text-[#05c8f6]"><FileUp className="h-4 w-4" /></span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e1e7ef]">onepdf // local session</p>
                        <p className="mt-0.5 text-xs text-[#8490a2]">Ready for a document</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#05c8f6]/25 bg-[#05c8f6]/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em] text-[#71ddf7]"><LockKeyhole className="h-3 w-3" /> Local</span>
                  </div>
                  <Link href="/tools/merge-pdf" className="mt-5 flex min-h-[196px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#05c8f6]/45 bg-[#05c8f6]/[0.045] px-5 text-center transition-colors hover:border-[#05c8f6] hover:bg-[#05c8f6]/[0.08]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[11px] border border-[#05c8f6]/25 bg-[#0b1820] text-[#05c8f6]"><FileUp className="h-5 w-5" /></span>
                    <span className="mt-4 font-display text-lg font-medium text-white">Drop PDF files here</span>
                    <span className="mt-1 text-sm text-[#8d99aa]">or browse from this device</span>
                  </Link>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    <div className="metric-chip"><span>Mode</span><strong>Local</strong></div>
                    <div className="metric-chip"><span>Account</span><strong>None</strong></div>
                    <div className="metric-chip"><span>Original</span><strong>Safe</strong></div>
                  </div>
                </div>
                <div className="relative mx-1 mt-3 flex items-center gap-3 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8794a7]">
                  <span className="h-px flex-1 bg-white/[0.09]" /><span className="text-[#05c8f6]">file boundary intact</span><span className="h-px flex-1 bg-white/[0.09]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.08] bg-[#090c11] py-6">
          <div className="container grid gap-4 sm:grid-cols-3 sm:gap-8">
            {[{ label: "Processing mode", value: "Browser-first" }, { label: "Core tools", value: "Free to use" }, { label: "File handling", value: "Original untouched" }].map((item) => (
              <div className="flex items-center gap-3" key={item.label}>
                <span className="h-8 w-px bg-[#05c8f6]" />
                <div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#778396]">{item.label}</p><p className="mt-1 text-sm font-medium text-[#e8edf4]">{item.value}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="container py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <div className="section-kicker">Flagship workbench</div>
              <h2 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-5xl">One operating surface for the everyday PDF jobs.</h2>
              <p className="mt-5 max-w-md leading-7 text-[#96a2b2]">Open a focused tool, make the change, download a fresh result. No unnecessary detours and no edits to your original file.</p>
              <Link href="/tools" className="button-secondary mt-7">View every tool <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[18px] border border-white/[0.1] bg-white/[0.1] sm:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map((tool, index) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tool-card group min-h-[180px] bg-[#0a0d13] p-5" style={{ animationDelay: `${index * 40}ms` }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/[0.1] bg-[#0e131b] text-[#8fe7fb] transition-colors group-hover:border-[#05c8f6]/45 group-hover:bg-[#05c8f6]/10"><ToolGlyph name={tool.icon} className="h-[18px] w-[18px]" /></span>
                  <h3 className="mt-6 font-display text-lg font-medium tracking-[-0.035em] text-white">{tool.name}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#8d99aa]">{tool.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#05c8f6]">Open tool <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.08] bg-[#090c11]">
          <div className="container grid gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div className="overflow-hidden rounded-[16px] border border-white/[0.1] bg-[#06080c]">
              <img src="/manus-storage/onepdf-workflow-abstract_436d20c0.png" alt="Abstract PDF assembly workflow" className="h-full min-h-[245px] w-full object-cover opacity-90" />
            </div>
            <div className="lg:pl-8">
              <div className="section-kicker"><span className="status-dot" /> Clear processing boundary</div>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white">The browser does the work whenever it can.</h2>
              <div className="mt-7 space-y-5">
                {[{ icon: ShieldCheck, title: "Local processing", copy: "Supported jobs run in this browser. Your selected file does not need an upload step." }, { icon: ScanSearch, title: "Visible mode labels", copy: "Every tool names its processing mode before you start, so the boundary is never hidden." }, { icon: Sparkles, title: "A fresh result", copy: "OnePDF generates a new document. Your original source file remains unchanged." }].map((item) => (
                  <div key={item.title} className="flex gap-4"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#05c8f6]/10 text-[#05c8f6]"><item.icon className="h-4 w-4" /></span><div><h3 className="font-medium text-[#e7edf5]">{item.title}</h3><p className="mt-1 text-sm leading-6 text-[#909cac]">{item.copy}</p></div></div>
                ))}
              </div>
              <Link href="/privacy" className="button-ghost mt-7 px-0 text-[#87e4fa]">Read the privacy model <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="container grid gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-28">
          <div>
            <div className="section-kicker">Document intelligence</div>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-5xl">Know what travels with your document.</h2>
            <p className="mt-6 max-w-lg leading-7 text-[#99a5b4]">A document can carry metadata beyond its pages. Start with a local scan, see what is present, then create a cleaner copy when it makes sense.</p>
            <Link href="/tools/pdf-privacy-scanner" className="button-primary mt-8">Scan PDF metadata <ScanSearch className="h-4 w-4" /></Link>
          </div>
          <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[18px] border border-white/[0.1] bg-[#0a0e14] p-4">
            <img src="/manus-storage/onepdf-metadata-clean_aacbc6ea.png" alt="Abstract PDF metadata cleanup visual" className="h-[330px] w-full rounded-[12px] object-cover opacity-75" />
            <div className="absolute bottom-8 left-8 right-8 rounded-[12px] border border-white/[0.12] bg-[#0b1018]/90 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#aab4c3]">Document profile</span><span className="text-xs text-[#05c8f6]">Local scan</span></div>
              <div className="mt-3 h-px bg-white/[0.1]" />
              <div className="mt-3 flex justify-between text-sm"><span className="text-[#98a4b5]">Metadata fields</span><span className="font-mono text-[#e9eef4]">Review before share</span></div>
            </div>
          </div>
        </section>

        <section className="container pb-20 md:pb-28">
          <div className="relative overflow-hidden rounded-[20px] border border-[#05c8f6]/25 bg-[#0b1119] px-6 py-12 sm:px-10 md:px-14 md:py-16">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_75%_25%,rgba(5,200,246,0.16),transparent_54%)]" aria-hidden="true" />
            <div className="relative max-w-2xl"><div className="section-kicker text-[#71ddf7]">Ready when the file is</div><h2 className="mt-5 font-display text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-5xl">Open the tool. Keep control of the document.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[#9eabbc]">Start with the free core tools. No account is required for the local workflows included today.</p><Link href="/tools" className="button-primary mt-8">Explore PDF tools <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
