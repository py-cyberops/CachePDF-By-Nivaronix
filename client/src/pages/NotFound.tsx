/** CachePDF Design Note: The fallback keeps the calm workbench voice and returns people to a useful local action. */
import SiteShell from "@/components/SiteShell";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
export default function NotFound() { return <SiteShell><main className="container flex min-h-[58vh] flex-col justify-center py-20"><div className="section-kicker">404 // Route not found</div><h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.07em] text-white">This workbench route is not available.</h1><p className="mt-5 max-w-lg text-base leading-7 text-[#96a3b3]">Open the CachePDF workbench to continue with a local document workflow.</p><Link href="/tools" className="button-primary mt-8 w-fit tracking-[0.08em]">OPEN PDF <ArrowRight className="h-4 w-4" /></Link></main></SiteShell>; }
