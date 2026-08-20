import { readFileSync } from "node:fs";
import path from "node:path";
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

  it("publishes canonical absolute URLs in static Pages SEO files", () => {
    const sitemap = readFileSync(path.resolve(process.cwd(), "client/public/sitemap.xml"), "utf8");
    const robots = readFileSync(path.resolve(process.cwd(), "client/public/robots.txt"), "utf8");
    const locValues = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(locValues.length).toBeGreaterThan(0);
    expect(locValues.every((value) => value.startsWith(CACHEPDF_CANONICAL_ORIGIN))).toBe(true);
    expect(sitemap).not.toContain("<loc>/");
    expect(robots).toContain(`Sitemap: ${CACHEPDF_CANONICAL_ORIGIN}/sitemap.xml`);
  });
});
