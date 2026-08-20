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
const Tools = lazy(() => import("./pages/Tools"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LazyRoute({ component: Component }: { component: ComponentType }) {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#07090d] text-[#a9b6c6]"><div className="font-mono text-[10px] uppercase tracking-[0.16em]">Opening CachePDF…</div></main>}><Component /></Suspense>;
}

function Router() {
  const toolRoute = () => <LazyRoute component={Tools} />;
  const workbenchRoute = () => <LazyRoute component={ToolWorkbench} />;
  const privacyRoute = () => <LazyRoute component={Privacy} />;
  const pricingRoute = () => <LazyRoute component={Pricing} />;
  const aboutRoute = () => <LazyRoute component={About} />;
  const notFoundRoute = () => <LazyRoute component={NotFound} />;
  return <Switch><Route path="/" component={Home} /><Route path="/tools" component={toolRoute} /><Route path="/tools/:slug" component={workbenchRoute} /><Route path="/privacy" component={privacyRoute} /><Route path="/pricing" component={pricingRoute} /><Route path="/about" component={aboutRoute} /><Route path="/404" component={notFoundRoute} /><Route component={notFoundRoute} /></Switch>;
}

function ThemedApp() {
  const { theme } = useTheme();
  return <TooltipProvider><Toaster theme={theme} richColors position="bottom-right" /><Router /></TooltipProvider>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><DensityProvider><DocumentSessionProvider><ThemedApp /></DocumentSessionProvider></DensityProvider></ThemeProvider></ErrorBoundary>;
}
