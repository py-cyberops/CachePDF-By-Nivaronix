/**
 * CachePDF Design Note: Route composition keeps local document handoff in memory while every
 * public and tool page stays inside the same privacy-conscious disclosure system.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense, type ComponentType } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { DocumentSessionProvider } from "./contexts/DocumentSessionContext";
import { DensityProvider } from "./contexts/DensityContext";
import Home from "./pages/Home";

const ToolWorkbench = lazy(() => import("./pages/ToolWorkbench"));
const SearchablePdfWorkbench = lazy(() => import("./pages/SearchablePdfWorkbench"));
const SignPdfWorkbench = lazy(() => import("./pages/SignPdfWorkbench"));
const CompressPdfWorkbench = lazy(() => import("./pages/CompressPdfWorkbench"));
const PrivacyCheckWorkbench = lazy(() => import("./pages/PrivacyCheckWorkbench"));
const Tools = lazy(() => import("./pages/Tools"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Guides = lazy(() => import("./pages/Guides"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const ToolLanding = lazy(() => import("./pages/ToolLanding"));
const Support = lazy(() => import("./pages/Support"));
const Advertise = lazy(() => import("./pages/Advertise"));
const PrivateTools = lazy(() => import("./pages/PrivateTools"));
const EditorialPolicy = lazy(() => import("./pages/EditorialPolicy"));

function LazyRoute({ component: Component }: { component: ComponentType }) {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#07090d] text-[#a9b6c6]"><div className="font-mono text-[10px] uppercase tracking-[0.16em]">Opening CachePDF…</div></main>}><Component /></Suspense>;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  const toolRoute = () => <LazyRoute component={Tools} />;
  const workbenchRoute = () => <LazyRoute component={ToolWorkbench} />;
  const searchablePdfRoute = () => <LazyRoute component={SearchablePdfWorkbench} />;
  const signPdfRoute = () => <LazyRoute component={SignPdfWorkbench} />;
  const compressPdfRoute = () => <LazyRoute component={CompressPdfWorkbench} />;
  const privacyCheckRoute = () => <LazyRoute component={PrivacyCheckWorkbench} />;
  const privacyRoute = () => <LazyRoute component={Privacy} />;
  const pricingRoute = () => <LazyRoute component={Pricing} />;
  const aboutRoute = () => <LazyRoute component={About} />;
  const guidesRoute = () => <LazyRoute component={Guides} />;
  const guidePageRoute = () => <LazyRoute component={GuidePage} />;
  const landingRoute = () => <LazyRoute component={ToolLanding} />;
  const supportRoute = () => <LazyRoute component={Support} />;
  const advertiseRoute = () => <LazyRoute component={Advertise} />;
  const privateToolsRoute = () => <LazyRoute component={PrivateTools} />;
  const editorialRoute = () => <LazyRoute component={EditorialPolicy} />;
  const notFoundRoute = () => <LazyRoute component={NotFound} />;
  return <Switch><Route path="/" component={Home} /><Route path="/tools" component={toolRoute} /><Route path="/tools/make-pdf-searchable" component={searchablePdfRoute} /><Route path="/tools/sign-pdf" component={signPdfRoute} /><Route path="/tools/compress-pdf" component={compressPdfRoute} /><Route path="/tools/document-privacy-check" component={privacyCheckRoute} /><Route path="/tools/:slug" component={workbenchRoute} /><Route path="/how-cachepdf-works" component={privacyRoute} /><Route path="/how-it-works" component={privacyRoute} /><Route path="/privacy" component={privacyRoute} /><Route path="/pricing" component={pricingRoute} /><Route path="/about" component={aboutRoute} /><Route path="/guides" component={guidesRoute} /><Route path="/guides/:slug" component={guidePageRoute} /><Route path="/support" component={supportRoute} /><Route path="/advertise" component={advertiseRoute} /><Route path="/private-pdf-tools" component={privateToolsRoute} /><Route path="/editorial-policy" component={editorialRoute} /><Route path="/merge-pdf" component={landingRoute} /><Route path="/split-pdf" component={landingRoute} /><Route path="/reorder-pdf-pages" component={landingRoute} /><Route path="/rotate-pdf" component={landingRoute} /><Route path="/extract-pdf-pages" component={landingRoute} /><Route path="/delete-pdf-pages" component={landingRoute} /><Route path="/jpg-to-pdf" component={landingRoute} /><Route path="/png-to-pdf" component={landingRoute} /><Route path="/images-to-pdf" component={landingRoute} /><Route path="/pdf-to-jpg" component={landingRoute} /><Route path="/pdf-to-png" component={landingRoute} /><Route path="/pdf-to-webp" component={landingRoute} /><Route path="/watermark-pdf" component={landingRoute} /><Route path="/add-page-numbers-pdf" component={landingRoute} /><Route path="/ocr-pdf" component={landingRoute} /><Route path="/make-pdf-searchable" component={landingRoute} /><Route path="/sign-pdf" component={landingRoute} /><Route path="/compress-pdf" component={landingRoute} /><Route path="/document-privacy-check" component={landingRoute} /><Route path="/view-pdf-metadata" component={landingRoute} /><Route path="/remove-pdf-metadata" component={landingRoute} /><Route path="/404" component={notFoundRoute} /><Route component={notFoundRoute} /></Switch>;
}

function ThemedApp() {
  const { theme } = useTheme();
  return <TooltipProvider><Toaster theme={theme} richColors position="bottom-right" /><Router /></TooltipProvider>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><DensityProvider><DocumentSessionProvider><ThemedApp /></DocumentSessionProvider></DensityProvider></ThemeProvider></ErrorBoundary>;
}
