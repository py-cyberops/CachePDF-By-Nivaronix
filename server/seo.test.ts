import { buildSitemap, getCanonicalOrigin } from "./seo";
import { describe, expect, it } from "vitest";
import { buildSitemap, CACHEPDF_CANONICAL_ORIGIN, getCanonicalOrigin } from "./seo";

describe("CachePDF technical SEO", () => {
  it("builds absolute canonical sitemap URLs for every public surface", () => {
    const sitemap = buildSitemap(CACHEPDF_CANONICAL_ORIGIN);
    expect(sitemap).toContain("<loc>https://cachepdf.nivaronix.com/</loc>");
    expect(sitemap).toContain("<loc>https://cachepdf.nivaronix.com/how-cachepdf-works</loc>");
    expect(sitemap).toContain("<loc>https://cachepdf.nivaronix.com/guides/ocr-scanned-pdf-locally</loc>");
    expect(sitemap).not.toContain("<loc>/");
  });

  it("uses the deployed forwarded origin when one is available", () => {
    const origin = getCanonicalOrigin({
      protocol: "http",
      headers: { "x-forwarded-host": "cachepdf.example.com", "x-forwarded-proto": "https" },
    });
    expect(origin).toBe("https://cachepdf.example.com");
  });
});
