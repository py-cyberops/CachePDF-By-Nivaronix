export function getCompressionMetrics(sourceBytes: number, outputBytes: number) {
  const savedBytes = Math.max(0, sourceBytes - outputBytes);
  const percent = sourceBytes > 0 ? Math.round((savedBytes / sourceBytes) * 100) : 0;
  return { savedBytes, percent, reduced: savedBytes > 0, deltaBytes: outputBytes - sourceBytes };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
