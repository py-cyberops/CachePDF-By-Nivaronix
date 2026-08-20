import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      await navigator.serviceWorker.ready;
      window.dispatchEvent(new Event("cachepdf-offline-ready"));
    }).catch(() => { /* App shell remains usable online; no inaccurate offline-ready status is shown. */ });
  });
}
