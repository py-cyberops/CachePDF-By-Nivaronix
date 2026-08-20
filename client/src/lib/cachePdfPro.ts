import { Capacitor, registerPlugin } from "@capacitor/core";

type ProPlugin = { getStatus: () => Promise<{ entitled: boolean }>; getProduct: () => Promise<{ productId: string; title: string; price: string }>; purchase: () => Promise<{ state: "purchased" | "pending" | "cancelled"; entitled: boolean }>; restore: () => Promise<{ entitled: boolean }> };
const CachePdfPro = registerPlugin<ProPlugin>("CachePdfPro");
export const CACHEPDF_PRO_PRODUCT_ID = "cachepdf_pro";
export const isAndroidStoreBuild = () => Capacitor.getPlatform() === "android";
export const getCachePdfProStatus = () => isAndroidStoreBuild() ? CachePdfPro.getStatus() : Promise.resolve({ entitled: false });
export const getCachePdfProProduct = () => CachePdfPro.getProduct();
export const purchaseCachePdfPro = () => CachePdfPro.purchase();
export const restoreCachePdfPro = () => CachePdfPro.restore();
