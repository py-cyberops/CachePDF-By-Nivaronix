/**
 * OnePDF Design Note: The fallback route preserves the restrained Technical Trust Ledger tone
 * and gives visitors a clear, useful route back into the workbench.
 */
import SiteShell from "@/components/SiteShell";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return <SiteShell><main className="container flex min-h-[58vh] flex-col justify-center py-20"><div className="section-kicker">404 // Route not found</div><h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.07em] text-white">The document path ends here.</h1><p className="mt-5 max-w-lg text-base leading-7 text-[#96a3b3]">This page does not exist, but the PDF workbench is still ready when you are.</p><Link href="/tools" className="button-primary mt-8 w-fit">Go to PDF tools <ArrowRight className="h-4 w-4" /></Link></main></SiteShell>;
}
