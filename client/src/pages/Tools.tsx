/**
 * OnePDF Design Note: The directory is a dense but breathable technical inventory, not a generic
 * card gallery. It uses categories, explicit tool readiness, and Nivaronix cyan only for action.
 */
import SiteShell from "@/components/SiteShell";
import { ToolGlyph } from "@/components/ToolGlyph";
import { allTools, toolCategories, type ToolState } from "@/lib/toolData";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const stateLabel: Record<ToolState, string> = { implemented: "Local now", experimental: "Experimental", planned: "In development" };

export default function Tools() {
  const [query, setQuery] = useState("");
  const [showLocal, setShowLocal] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allTools.filter((tool) => (!normalized || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalized)) && (!showLocal || tool.local));
  }, [query, showLocal]);

  return (
    <SiteShell>
      <main className="min-h-[70vh]">
        <section className="border-b border-white/[0.08] bg-[#090c11]">
          <div className="container grid gap-8 py-14 md:grid-cols-[1fr_0.85fr] md:items-end md:py-20">
            <div><div className="section-kicker">Tool directory // 25 utilities</div><h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.93] tracking-[-0.07em] text-white sm:text-6xl">Start with the job, not an upload.</h1><p className="mt-6 max-w-xl leading-7 text-[#98a5b4]">Each tool has one clear document operation, a visible mode label, and an original-safe output flow.</p></div>
            <div className="surface p-3"><div className="flex items-center gap-3 rounded-[10px] border border-white/[0.1] bg-[#080b10] px-3.5 py-2.5"><Search className="h-4 w-4 text-[#05c8f6]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#667386]" placeholder="Find a tool" aria-label="Find a PDF tool" /><kbd className="hidden rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[9px] text-[#697587] sm:inline">⌘ K</kbd></div><label className="mt-3 flex cursor-pointer items-center justify-between rounded-[9px] px-2 py-1.5 text-xs text-[#8e9aac]"><span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5 text-[#05c8f6]" />Show browser-first tools</span><input type="checkbox" checked={showLocal} onChange={(event) => setShowLocal(event.target.checked)} className="accent-[#05c8f6]" /></label></div>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          {query || showLocal ? (
            <div><div className="mb-5 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8491a4]">{filtered.length} matching tools</p><button onClick={() => { setQuery(""); setShowLocal(false); }} className="text-xs text-[#70dff8] hover:text-white">Clear filters</button></div><ToolList tools={filtered} /></div>
          ) : toolCategories.map((category) => (
            <section key={category.name} className="border-b border-white/[0.08] py-10 first:pt-0 last:border-b-0">
              <div className="grid gap-5 md:grid-cols-[220px_1fr] md:gap-10"><div><p className="font-display text-2xl font-medium tracking-[-0.05em] text-white">{category.name}</p><p className="mt-2 text-sm leading-6 text-[#7e8b9d]">{category.detail}</p></div><ToolList tools={category.tools} /></div>
            </section>
          ))}
        </section>
      </main>
    </SiteShell>
  );
}

function ToolList({ tools }: { tools: typeof allTools }) {
  if (!tools.length) return <div className="surface-quiet p-8 text-sm text-[#8491a4]">No tools match this search. Try “merge”, “privacy”, or “watermark”.</div>;
  return <div className="grid gap-px overflow-hidden rounded-[15px] border border-white/[0.1] bg-white/[0.1] sm:grid-cols-2 xl:grid-cols-3">{tools.map((tool) => <Link href={`/tools/${tool.slug}`} key={tool.slug} className="tool-card group min-h-[190px] bg-[#090d13] p-5"><div className="flex items-start justify-between gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/[0.1] bg-[#0d121a] text-[#85e3f8] group-hover:border-[#05c8f6]/45 group-hover:bg-[#05c8f6]/10"><ToolGlyph name={tool.icon} className="h-[18px] w-[18px]" /></span><span className={`state-pill state-${tool.state}`}>{stateLabel[tool.state]}</span></div><h2 className="mt-6 font-display text-lg font-medium tracking-[-0.035em] text-white">{tool.name}</h2><p className="mt-2 text-sm leading-5 text-[#8b97a8]">{tool.description}</p><span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#05c8f6]">Open workspace <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</div>;
}
