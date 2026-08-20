export type CompressionStatus = "TARGET REACHED" | "PARTIAL REDUCTION" | "ALREADY OPTIMIZED" | "QUALITY LOSS REQUIRED";

export function getCompressionMetrics(sourceBytes: number, outputBytes: number) {
  const savedBytes = Math.max(0, sourceBytes - outputBytes);
  const percent = sourceBytes > 0 ? Math.round((savedBytes / sourceBytes) * 100) : 0;
  return { savedBytes, percent, reduced: savedBytes > 0, deltaBytes: outputBytes - sourceBytes };
}

export function getTargetBytes(sourceBytes: number, preset: "best-effort" | "ten" | "twenty-five" | "custom", customValue: number, customUnit: "KB" | "MB") {
  if (preset === "ten") return Math.floor(sourceBytes * 0.9);
  if (preset === "twenty-five") return Math.floor(sourceBytes * 0.75);
  if (preset === "custom") return Math.max(1, customValue) * (customUnit === "MB" ? 1024 * 1024 : 1024);
  return sourceBytes;
}

export function getCompressionStatus(sourceBytes: number, outputBytes: number, targetBytes: number, targetSelected: boolean): CompressionStatus {
  const metrics = getCompressionMetrics(sourceBytes, outputBytes);
  if (!metrics.reduced) return targetSelected ? "QUALITY LOSS REQUIRED" : "ALREADY OPTIMIZED";
  return outputBytes <= targetBytes ? "TARGET REACHED" : "PARTIAL REDUCTION";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
