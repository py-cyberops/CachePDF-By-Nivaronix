import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { cleanupPdfPrivacy, inspectPdfPrivacy } from "../client/src/lib/privacyInspector";

describe("CachePDF local privacy inspector", () => {
  it("finds and clears common metadata in a fresh in-memory document", async () => {
    const document = await PDFDocument.create(); document.addPage(); document.setTitle("Private draft"); document.setAuthor("CachePDF fixture");
    expect(inspectPdfPrivacy(document).find((finding) => finding.id === "metadata")?.detected).toBe(true);
    cleanupPdfPrivacy(document, { metadata: true, "form-fields": false, annotations: false, "embedded-files": false, "document-actions": false });
    expect(document.getTitle()).toBeUndefined(); expect(document.getAuthor()).toBeUndefined();
  });

  it("removes metadata and document dates across a saved, rechecked, and repeatedly cleaned PDF", async () => {
    const source = await PDFDocument.create(); source.addPage(); source.setTitle("Private draft"); source.setAuthor("CachePDF fixture"); source.setCreationDate(new Date("2025-01-02T03:04:05Z")); source.setModificationDate(new Date("2025-02-03T04:05:06Z"));
    const firstPass = await PDFDocument.load(await source.save(), { updateMetadata: false });
    expect(inspectPdfPrivacy(firstPass).find((finding) => finding.id === "metadata")?.detected).toBe(true);
    cleanupPdfPrivacy(firstPass, { metadata: true, "form-fields": false, annotations: false, "embedded-files": false, "document-actions": false });
    const rechecked = await PDFDocument.load(await firstPass.save(), { updateMetadata: false });
    expect(inspectPdfPrivacy(rechecked).find((finding) => finding.id === "metadata")?.detected).toBe(false);
    cleanupPdfPrivacy(rechecked, { metadata: true, "form-fields": false, annotations: false, "embedded-files": false, "document-actions": false });
    const secondPass = await PDFDocument.load(await rechecked.save(), { updateMetadata: false });
    expect(inspectPdfPrivacy(secondPass).find((finding) => finding.id === "metadata")?.detected).toBe(false);
  });

  it("removes an injected open action from the cleaned output model", async () => {
    const document = await PDFDocument.create(); document.addPage(); document.catalog.set(PDFName.of("OpenAction"), PDFName.of("Next"));
    expect(inspectPdfPrivacy(document).find((finding) => finding.id === "document-actions")?.detected).toBe(true);
    cleanupPdfPrivacy(document, { metadata: false, "form-fields": false, annotations: false, "embedded-files": false, "document-actions": true });
    expect(document.catalog.get(PDFName.of("OpenAction"))).toBeUndefined();
  });
});
