/**
 * CachePDF Design Note: The shell presents CachePDF as an independent, calm Nivaronix product.
 * The typographic wordmark leads; the Nivaronix endorsement and LOCAL SESSION trust state remain
 * available but visually secondary.
 */
import { Menu, X, ArrowUpRight, Moon, Sun, Monitor } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import LocalSessionTrust from "@/components/LocalSessionTrust";

const navItems = [
  { href: "/tools", label: "Workbench" },
  { href: "/how-cachepdf-works", label: "How it works" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
];

export default function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { theme, preference, setPreference } = useTheme();
  const isDark = theme === "dark";
  const parentLogoExtended = isDark ? "/branding/nivaronix-light-extended.svg" : "/branding/nivaronix-dark-extended.svg";

  return <div className={`site-shell min-h-screen overflow-x-clip bg-[#07090d] text-[#f5f7fa] ${isDark ? "theme-dark" : "theme-light-surface"}`}>
    <header className="site-header sticky top-0 z-50 border-b border-white/[0.08] bg-[#07090d]/95 backdrop-blur-xl">
      <div className="container flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0" aria-label="CachePDF home"><img src={isDark ? "/branding/cachepdf-horizontal-dark.svg" : "/branding/cachepdf-horizontal-light.svg"} alt="CachePDF by Nivaronix" className="h-7 w-auto max-w-[172px] object-contain object-left" /></Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">{navItems.map((item) => <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>)}<a href="https://github.com/nivaronix" target="_blank" rel="noreferrer" className="nav-link flex items-center gap-1.5">GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a></nav>
        <div className="hidden items-center gap-2 sm:flex"><LocalSessionTrust compact /><div className="relative"><button className="button-icon theme-toggle" onClick={() => setThemeMenuOpen((open) => !open)} aria-label="Choose theme preference" aria-expanded={themeMenuOpen} title="Theme preference">{preference === "system" ? <Monitor className="h-4 w-4" /> : isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>{themeMenuOpen && <div className="theme-menu"><button onClick={() => { setPreference("light"); setThemeMenuOpen(false); }} className={preference === "light" ? "theme-option-active" : ""}><Sun className="h-3.5 w-3.5" /> Light</button><button onClick={() => { setPreference("dark"); setThemeMenuOpen(false); }} className={preference === "dark" ? "theme-option-active" : ""}><Moon className="h-3.5 w-3.5" /> Dark</button><button onClick={() => { setPreference("system"); setThemeMenuOpen(false); }} className={preference === "system" ? "theme-option-active" : ""}><Monitor className="h-3.5 w-3.5" /> System</button></div>}</div><Link href="/tools" className="button-primary text-xs tracking-[0.08em]">OPEN PDF <ArrowUpRight className="h-4 w-4" /></Link></div>
        <button className="button-icon sm:hidden" onClick={() => setMenuOpen((current) => !current)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {menuOpen && <div className="mobile-menu border-t border-white/[0.08] bg-[#0b0e14] px-4 py-4 sm:hidden"><nav className="container flex flex-col gap-1" aria-label="Mobile navigation">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="mobile-nav-link">{item.label}</Link>)}<a href="https://github.com/nivaronix" target="_blank" rel="noreferrer" className="mobile-nav-link">GitHub</a><div className="mt-3"><LocalSessionTrust /></div><div className="mt-3 grid grid-cols-3 gap-2"><button className={`button-secondary justify-center text-xs ${preference === "light" ? "theme-mobile-active" : ""}`} onClick={() => setPreference("light")}><Sun className="h-4 w-4" />Light</button><button className={`button-secondary justify-center text-xs ${preference === "dark" ? "theme-mobile-active" : ""}`} onClick={() => setPreference("dark")}><Moon className="h-4 w-4" />Dark</button><button className={`button-secondary justify-center text-xs ${preference === "system" ? "theme-mobile-active" : ""}`} onClick={() => setPreference("system")}><Monitor className="h-4 w-4" />System</button></div><Link href="/tools" onClick={() => setMenuOpen(false)} className="button-primary mt-3 justify-center tracking-[0.08em]">OPEN PDF <ArrowUpRight className="h-4 w-4" /></Link></nav></div>}
    </header>
    {children}
    <footer className="site-footer border-t border-white/[0.08] bg-[#05070a]"><div className="container grid gap-10 py-12 md:grid-cols-[1.1fr_1.9fr] md:py-16"><div><Link href="/" className="inline-flex" aria-label="CachePDF home"><img src={isDark ? "/branding/cachepdf-horizontal-dark.svg" : "/branding/cachepdf-horizontal-light.svg"} alt="CachePDF by Nivaronix" className="h-8 w-auto max-w-[210px] object-contain object-left" /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-[#98a2b3]">The private PDF workbench. Open, work, and export supported PDF workflows directly in your browser.</p><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5fd8f5]">Open. Work. Export. Nothing leaves.</p></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-4"><div><p className="footer-label">Workbench</p><div className="mt-4 flex flex-col gap-3"><Link href="/tools" className="footer-link">Open PDF</Link><Link href="/private-pdf-tools" className="footer-link">Private PDF tools</Link><Link href="/how-cachepdf-works" className="footer-link">How it works</Link><Link href="/guides" className="footer-link">Guides</Link></div></div><div><p className="footer-label">New local tools</p><div className="mt-4 flex flex-col gap-3"><Link href="/make-pdf-searchable" className="footer-link">Make PDF searchable</Link><Link href="/sign-pdf" className="footer-link">Sign PDF</Link><Link href="/compress-pdf" className="footer-link">Compress PDF</Link><Link href="/document-privacy-check" className="footer-link">Privacy Check</Link></div></div><div><p className="footer-label">About</p><div className="mt-4 flex flex-col gap-3"><Link href="/support" className="footer-link">Support CachePDF</Link><Link href="/advertise" className="footer-link">Advertise</Link><Link href="/editorial-policy" className="footer-link">Editorial policy</Link><Link href="/about" className="footer-link">About CachePDF</Link></div></div><div className="col-span-2 sm:col-span-1"><p className="footer-label">Product studio</p><img src={parentLogoExtended} alt="Nivaronix" className="mt-4 h-auto w-[155px] opacity-90" /></div></div></div><div className="border-t border-white/[0.07]"><div className="container flex flex-col justify-between gap-3 py-5 font-mono text-[10px] uppercase tracking-[0.13em] text-[#687386] sm:flex-row"><span>© 2026 CachePDF by Nivaronix</span><span>LOCAL PROCESSING · ORIGINALS UNTOUCHED</span></div></div></footer>
  </div>;
}
