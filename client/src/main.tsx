import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      await navigator.serviceWorker.ready;
      const resources = performance.getEntriesByType("resource").map((entry) => entry.name).filter((url) => url.startsWith(window.location.origin));
      (registration.active ?? navigator.serviceWorker.controller)?.postMessage({ type: "CACHEPDF_CACHE_URLS", urls: Array.from(new Set([window.location.href, ...resources])) });
      window.dispatchEvent(new Event("cachepdf-offline-ready"));
    }).catch(() => { /* App shell remains usable online; no inaccurate offline-ready status is shown. */ });
  });
}
