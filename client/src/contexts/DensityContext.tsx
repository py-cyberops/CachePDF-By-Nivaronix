/** CachePDF Design Note: Density is a local preference that changes information rhythm without
 * changing task order or hiding trust details in the document workbench. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Density = "comfortable" | "compact";
type DensityValue = { density: Density; setDensity: (density: Density) => void };
const DensityContext = createContext<DensityValue | undefined>(undefined);

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>(() => (localStorage.getItem("cachepdf-density") as Density) || "comfortable");
  const setDensity = (nextDensity: Density) => setDensityState(nextDensity);
  useEffect(() => { localStorage.setItem("cachepdf-density", density); }, [density]);
  return <DensityContext.Provider value={{ density, setDensity }}>{children}</DensityContext.Provider>;
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (!context) throw new Error("useDensity must be used within DensityProvider.");
  return context;
}
