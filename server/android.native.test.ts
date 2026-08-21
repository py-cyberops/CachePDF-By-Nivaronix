import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CachePDF Android native safeguards", () => {
  const manifest = readFileSync(path.resolve(process.cwd(), "android/app/src/main/AndroidManifest.xml"), "utf8");
  const documentPlugin = readFileSync(path.resolve(process.cwd(), "android/app/src/main/java/com/nivaronix/cachepdf/NativeDocumentPlugin.java"), "utf8");
  const extractionRules = readFileSync(path.resolve(process.cwd(), "android/app/src/main/res/xml/data_extraction_rules.xml"), "utf8");

  it("uses the Storage Access Framework without broad storage permissions", () => {
    expect(documentPlugin).toContain("Intent.ACTION_OPEN_DOCUMENT");
    expect(documentPlugin).toContain("Intent.ACTION_CREATE_DOCUMENT");
    expect(manifest).not.toContain("READ_EXTERNAL_STORAGE");
    expect(manifest).not.toContain("WRITE_EXTERNAL_STORAGE");
    expect(manifest).not.toContain("MANAGE_EXTERNAL_STORAGE");
  });

  it("declares a no-backup policy and releases native export streams", () => {
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
    expect(extractionRules).toContain('<exclude domain="root" path="." />');
    expect(documentPlugin).toContain("try (java.io.InputStream sourceInput");
    expect(documentPlugin).toContain("java.io.OutputStream output");
  });
});
