/**
 * OnePDF Design Note: Route composition is intentionally simple so every public and tool page
 * stays inside the same dark, privacy-conscious OnePDF navigation and disclosure system.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import About from "./pages/About";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import ToolWorkbench from "./pages/ToolWorkbench";
import Tools from "./pages/Tools";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/tools" component={Tools} /><Route path="/tools/:slug" component={ToolWorkbench} /><Route path="/privacy" component={Privacy} /><Route path="/pricing" component={Pricing} /><Route path="/about" component={About} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function ThemedApp() {
  const { theme } = useTheme();
  return <TooltipProvider><Toaster theme={theme} richColors position="bottom-right" /><Router /></TooltipProvider>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><ThemedApp /></ThemeProvider></ErrorBoundary>;
}
