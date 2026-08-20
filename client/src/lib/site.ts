export const CACHEPDF_CANONICAL_ORIGIN = "https://cachepdf.nivaronix.com";

export function canonicalUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${CACHEPDF_CANONICAL_ORIGIN}${normalizedPath}`;
}
