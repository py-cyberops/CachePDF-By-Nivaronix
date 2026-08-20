export function defaultOutputName(sourceName: string, extension: string) {
  const normalizedExtension = extension.replace(/^\./, "");
  if (sourceName.toLowerCase().endsWith(`.${normalizedExtension.toLowerCase()}`)) return sourceName;
  const baseName = sourceName.replace(/\.[^/.]+$/, "").trim() || "cachepdf-output";
  return `${baseName}.${normalizedExtension}`;
}

export function requestedDownloadName(requestedName: string, fallbackName: string) {
  const trimmed = requestedName.trim();
  if (!trimmed) return fallbackName;
  return trimmed.replace(/[\\/]/g, "_");
}
