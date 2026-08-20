type TelemetryValue = string | number | boolean;
type TelemetryProperties = Record<string, TelemetryValue | undefined>;

const blockedField = /file|name|document|pdf|ocr|text|metadata|watermark|signature|password|form|content|hash/i;

declare global {
  interface Window {
    umami?: { track?: (event: string, properties?: Record<string, TelemetryValue>) => void };
  }
}

export function sanitizeTelemetryProperties(properties: TelemetryProperties = {}) {
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) => !blockedField.test(key) && value !== undefined)) as Record<string, TelemetryValue>;
}

export function trackCachePdfEvent(event: string, properties?: TelemetryProperties) {
  if (typeof window === "undefined") return;
  window.umami?.track?.(event, sanitizeTelemetryProperties(properties));
}
