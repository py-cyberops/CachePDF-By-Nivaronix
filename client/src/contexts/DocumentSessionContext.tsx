/** CachePDF Design Note: Selected files move only through in-memory client state, allowing the
 * hero to hand a locally chosen document directly to the workbench without network transit. */
import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

type DocumentSessionValue = { queueFiles: (files: File[]) => void; consumeFiles: () => File[] };
const DocumentSessionContext = createContext<DocumentSessionValue | null>(null);

export function DocumentSessionProvider({ children }: { children: ReactNode }) {
  const pendingFiles = useRef<File[]>([]);
  const queueFiles = useCallback((files: File[]) => { pendingFiles.current = files; }, []);
  const consumeFiles = useCallback(() => { const files = pendingFiles.current; pendingFiles.current = []; return files; }, []);
  return <DocumentSessionContext.Provider value={{ queueFiles, consumeFiles }}>{children}</DocumentSessionContext.Provider>;
}

export function useDocumentSession() {
  const context = useContext(DocumentSessionContext);
  if (!context) throw new Error("useDocumentSession must be used within DocumentSessionProvider.");
  return context;
}
