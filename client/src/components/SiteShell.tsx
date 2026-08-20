/**
 * CachePDF Design Note: The shell presents CachePDF as an independent, calm Nivaronix product.
 * The typographic wordmark leads; the Nivaronix endorsement and LOCAL SESSION trust state remain
 * available but visually secondary.
 */
import { Menu, X, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import LocalSessionTrust from "@/components/LocalSessionTrust";

const navItems = [
  { href: "/tools", label: "Workbench" },
  { href: "/privacy", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const parentLogo = isDark ? "/manus-storage/Nivaronix-Logo-light_d2fbc7d6.svg" : "/manus-storage/Nivaronix-Logo-dark_5d5b7c14.svg";
  const parentLogoExtended = isDark ? "/manus-storage/Nivaronix-Logo-light-extended_cb961f4e.svg" : "/manus-storage/Nivaronix-Logo-dark-extended_a333177a.svg";

  return <div className={`site-shell min-h-screen overflow-x-clip bg-[#07090d] text-[#f5f7fa] ${isDark ? "theme-dark" : "theme-light-surface"}`}>
    <header className="site-header sticky top-0 z-50 border-b border-white/[0.08] bg-[#07090d]/95 backdrop-blur-xl">
      <div className="container flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="CachePDF home"><span className="font-display text-[1.1rem] font-semibold tracking-[-0.06em] text-white">CachePDF</span><span className="hidden items-center gap-1.5 sm:inline-flex"><span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#8591a3]">by</span><img src={parentLogo} alt="Nivaronix" className="h-[11px] w-auto opacity-85" /></span></Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>)}<a href="https://github.com/nivaronix" target="_blank" rel="noreferrer" className="nav-link flex items-center gap-1.5">GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a></nav>
        <div className="hidden items-center gap-2 sm:flex"><LocalSessionTrust compact /><button className="button-icon theme-toggle" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Light mode" : "Dark mode"}>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><Link href="/tools" className="button-primary text-xs tracking-[0.08em]">OPEN PDF <ArrowUpRight className="h-4 w-4" /></Link></div>
        <button className="button-icon sm:hidden" onClick={() => setMenuOpen((current) => !current)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {menuOpen && <div className="mobile-menu border-t border-white/[0.08] bg-[#0b0e14] px-4 py-4 sm:hidden"><nav className="container flex flex-col gap-1" aria-label="Mobile navigation">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="mobile-nav-link">{item.label}</Link>)}<a href="https://github.com/nivaronix" target="_blank" rel="noreferrer" className="mobile-nav-link">GitHub</a><div className="mt-3"><LocalSessionTrust /></div><button className="button-secondary mt-3 justify-center" onClick={toggleTheme}>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{isDark ? "Use light mode" : "Use dark mode"}</button><Link href="/tools" onClick={() => setMenuOpen(false)} className="button-primary mt-3 justify-center tracking-[0.08em]">OPEN PDF <ArrowUpRight className="h-4 w-4" /></Link></nav></div>}
    </header>
    {children}
    <footer className="site-footer border-t border-white/[0.08] bg-[#05070a]"><div className="container grid gap-10 py-12 md:grid-cols-[1.1fr_1.6fr] md:py-16"><div><Link href="/" className="inline-flex items-baseline gap-2" aria-label="CachePDF home"><span className="font-display text-xl font-semibold tracking-[-0.06em]">CachePDF</span><span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#8190a2]">by Nivaronix</span></Link><p className="mt-4 max-w-sm text-sm leading-6 text-[#98a2b3]">The private PDF workbench. Open, work, and export supported PDF workflows directly in your browser.</p><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5fd8f5]">Open. Work. Export. Nothing leaves.</p></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-3"><div><p className="footer-label">Workbench</p><div className="mt-4 flex flex-col gap-3"><Link href="/tools" className="footer-link">Open PDF</Link><Link href="/tools" className="footer-link">Operating modes</Link><Link href="/privacy" className="footer-link">How it works</Link></div></div><div><p className="footer-label">Company</p><div className="mt-4 flex flex-col gap-3"><Link href="/about" className="footer-link">About CachePDF</Link><a className="footer-link" href="https://nivaronix.com/" target="_blank" rel="noreferrer">Nivaronix</a><a className="footer-link" href="https://github.com/nivaronix" target="_blank" rel="noreferrer">GitHub</a></div></div><div className="col-span-2 sm:col-span-1"><p className="footer-label">Built by</p><img src={parentLogoExtended} alt="Nivaronix" className="mt-4 h-auto w-[155px] opacity-90" /></div></div></div><div className="border-t border-white/[0.07]"><div className="container flex flex-col justify-between gap-3 py-5 font-mono text-[10px] uppercase tracking-[0.13em] text-[#687386] sm:flex-row"><span>© 2026 CachePDF by Nivaronix</span><span>LOCAL PROCESSING · ORIGINALS UNTOUCHED</span></div></div></footer>
  </div>;
}
