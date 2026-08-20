import { App as NativeApp } from "@capacitor/app";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useDocumentSession } from "@/contexts/DocumentSessionContext";
import { consumeNativeIncomingDocument, isNativeAndroid, readNativeDocument, shareNativeExport } from "@/lib/nativeFiles";

export default function NativeDocumentBridge() {
  const { queueFiles } = useDocumentSession();
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (!isNativeAndroid()) return;
    let cancelled = false;
    void (async () => {
      const incoming = await consumeNativeIncomingDocument();
      if (!incoming || cancelled) return;
      const file = await readNativeDocument(incoming);
      if (cancelled) return;
      queueFiles([file]);
      navigate(file.type.startsWith("image/") ? "/tools/images-to-pdf" : "/tools/merge-pdf");
    })().catch(() => undefined);
    const listener = NativeApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && location !== "/") window.history.back();
      else void NativeApp.exitApp();
    });
    const nativeClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function cachePdfAndroidExport() {
      if (!this.href.startsWith("blob:") || !this.download) return nativeClick.call(this);
      const href = this.href; const name = this.download;
      void fetch(href).then((response) => response.blob()).then((blob) => shareNativeExport("Save CachePDF result", name, blob)).catch(() => undefined);
    };
    return () => { cancelled = true; HTMLAnchorElement.prototype.click = nativeClick; void listener.then((item) => item.remove()); };
  }, [location, navigate, queueFiles]);
  return null;
}
