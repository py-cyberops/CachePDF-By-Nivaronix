/** CachePDF Design Note: Density choices are small, direct operating controls, not a visual
 * preference maze. Comfortable preserves reading room; compact shortens card rhythm. */
import { AlignJustify, Rows3 } from "lucide-react";
import { useDensity } from "@/contexts/DensityContext";

export default function DensityControl({ compact = false }: { compact?: boolean }) {
  const { density, setDensity } = useDensity();
  return <div className={`density-control ${compact ? "density-control-compact" : ""}`} aria-label="Workbench visual density">
    {!compact && <span className="density-label">Density</span>}
    <button type="button" onClick={() => setDensity("comfortable")} className={density === "comfortable" ? "density-active" : ""} aria-pressed={density === "comfortable"} title="Comfortable spacing"><Rows3 className="h-3.5 w-3.5" /><span className="sr-only">Comfortable density</span>{!compact && <span>Comfortable</span>}</button>
    <button type="button" onClick={() => setDensity("compact")} className={density === "compact" ? "density-active" : ""} aria-pressed={density === "compact"} title="Compact spacing"><AlignJustify className="h-3.5 w-3.5" /><span className="sr-only">Compact density</span>{!compact && <span>Compact</span>}</button>
  </div>;
}
