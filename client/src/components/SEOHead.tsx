/** CachePDF Design Note: Public discovery routes carry useful, task-specific metadata and visible
 * content. Schema only describes features users can actually access in the browser. */
import { useEffect } from "react";
import { canonicalUrl } from "@/lib/site";

type SEOHeadProps = { title: string; description: string; path: string; schema?: Record<string, unknown> };

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.content = content;
}

export default function SEOHead({ title, description, path, schema }: SEOHeadProps) {
  useEffect(() => {
    const pageCanonicalUrl = canonicalUrl(path);
    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", pageCanonicalUrl);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = pageCanonicalUrl;
    const oldSchema = document.getElementById("cachepdf-page-schema");
    oldSchema?.remove();
    if (schema) { const script = document.createElement("script"); script.id = "cachepdf-page-schema"; script.type = "application/ld+json"; script.text = JSON.stringify(schema); document.head.appendChild(script); }
  }, [title, description, path, schema]);
  return null;
}
