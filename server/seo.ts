import type { Request, Response } from "express";

export const CACHEPDF_PUBLIC_PATHS = [
  "/", "/tools", "/how-cachepdf-works", "/private-pdf-tools", "/guides", "/support", "/advertise", "/editorial-policy",
  "/merge-pdf", "/split-pdf", "/reorder-pdf-pages", "/rotate-pdf", "/extract-pdf-pages", "/delete-pdf-pages",
  "/jpg-to-pdf", "/png-to-pdf", "/images-to-pdf", "/pdf-to-jpg", "/pdf-to-png", "/pdf-to-webp", "/watermark-pdf",
  "/add-page-numbers-pdf", "/ocr-pdf", "/view-pdf-metadata", "/remove-pdf-metadata", "/guides/merge-pdfs-without-uploading",
  "/make-pdf-searchable", "/sign-pdf", "/compress-pdf", "/document-privacy-check",
  "/guides/remove-pdf-metadata", "/guides/ocr-scanned-pdf-locally", "/guides/rearrange-pdf-pages-privately",
] as const;

export const CACHEPDF_CANONICAL_ORIGIN = "https://cachepdf.nivaronix.com";

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value?.split(",")[0]?.trim();
}

export function getCanonicalOrigin(request: Pick<Request, "protocol" | "headers">) {
  const forwardedHost = firstHeaderValue(request.headers["x-forwarded-host"]);
  const host = forwardedHost || firstHeaderValue(request.headers.host) || "localhost";
  const forwardedProtocol = firstHeaderValue(request.headers["x-forwarded-proto"]);
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https" ? forwardedProtocol : request.protocol || "https";
  return `${protocol}://${host}`;
}

export function buildSitemap(origin: string) {
  const base = origin.replace(/\/$/, "");
  const urls = CACHEPDF_PUBLIC_PATHS.map((path) => `  <url><loc>${base}${path}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function sendSitemap(request: Request, response: Response) {
  response.type("application/xml").send(buildSitemap(CACHEPDF_CANONICAL_ORIGIN));
}

export function sendRobots(request: Request, response: Response) {
  response.type("text/plain").send(`User-agent: *\nAllow: /\n\nSitemap: ${CACHEPDF_CANONICAL_ORIGIN}/sitemap.xml\n`);
}
