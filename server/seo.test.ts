import { buildSitemap, getCanonicalOrigin } from "./seo";
import { describe, expect, it } from "vitest";

describe("CachePDF technical SEO", () => {
  it("builds absolute canonical sitemap URLs for every public surface", () => {
    const sitemap = buildSitemap("https://cachepdf.example.com/");
    expect(sitemap).toContain("<loc>https://cachepdf.example.com/</loc>");
    expect(sitemap).toContain("<loc>https://cachepdf.example.com/how-it-works</loc>");
    expect(sitemap).toContain("<loc>https://cachepdf.example.com/guides/ocr-scanned-pdf-locally</loc>");
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
