import { PDFDict, PDFDocument, PDFName, PDFArray } from "pdf-lib";

export type PrivacyFindingId = "metadata" | "form-fields" | "annotations" | "embedded-files" | "document-actions";
export type PrivacyFinding = { id: PrivacyFindingId; label: string; detail: string; severity: "notice" | "review"; detected: boolean; cleanupSupported: boolean };
export type PrivacyCleanupSelection = Record<PrivacyFindingId, boolean>;

const metadata = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"] as const;
const name = (value: string) => PDFName.of(value);

function documentInfo(document: PDFDocument) {
  const info = document.context.trailerInfo.Info;
  return info ? document.context.lookupMaybe(info, PDFDict) : undefined;
}

function documentNames(document: PDFDocument) {
  return document.catalog.lookupMaybe(name("Names"), PDFDict);
}

export function inspectPdfPrivacy(document: PDFDocument): PrivacyFinding[] {
  const info = documentInfo(document);
  const metadataPresent = metadata.some((field) => Boolean(info?.get(name(field)))) || Boolean(info?.get(name("CreationDate")) || info?.get(name("ModDate")));
  const formFields = document.getForm().getFields().length;
  const annotationCount = document.getPages().reduce((total, page) => total + (page.node.lookupMaybe(name("Annots"), PDFArray)?.size() ?? 0), 0);
  const names = documentNames(document);
  const embedded = Boolean(names?.lookupMaybe(name("EmbeddedFiles"), PDFDict));
  const actions = Boolean(document.catalog.get(name("OpenAction")) || document.catalog.get(name("AA")) || names?.lookupMaybe(name("JavaScript"), PDFDict));
  return [
    { id: "metadata", label: "Common document metadata", detail: metadataPresent ? "Common information fields or document dates are present." : "No common information fields or document dates were found.", severity: "notice", detected: metadataPresent, cleanupSupported: true },
    { id: "form-fields", label: "Interactive form fields", detail: formFields ? `${formFields} interactive form ${formFields === 1 ? "field is" : "fields are"} present.` : "No interactive form fields were found.", severity: "review", detected: Boolean(formFields), cleanupSupported: true },
    { id: "annotations", label: "Comments or annotations", detail: annotationCount ? `${annotationCount} page annotation ${annotationCount === 1 ? "is" : "are"} present.` : "No page annotations were found.", severity: "review", detected: Boolean(annotationCount), cleanupSupported: true },
    { id: "embedded-files", label: "Embedded file references", detail: embedded ? "An embedded-file name tree is present." : "No embedded-file name tree was found.", severity: "review", detected: embedded, cleanupSupported: true },
    { id: "document-actions", label: "Document actions", detail: actions ? "Open, additional, or JavaScript document actions are present." : "No common open, additional, or JavaScript actions were found.", severity: "review", detected: actions, cleanupSupported: true },
  ];
}

export function cleanupPdfPrivacy(document: PDFDocument, selection: PrivacyCleanupSelection) {
  if (selection.metadata) {
    const info = documentInfo(document);
    [...metadata, "CreationDate", "ModDate"].forEach((field) => info?.delete(name(field)));
  }
  if (selection["form-fields"]) { const form = document.getForm(); if (form.getFields().length) form.flatten(); }
  if (selection.annotations) document.getPages().forEach((page) => page.node.delete(name("Annots")));
  const names = documentNames(document);
  if (selection["embedded-files"]) names?.delete(name("EmbeddedFiles"));
  if (selection["document-actions"]) { document.catalog.delete(name("OpenAction")); document.catalog.delete(name("AA")); names?.delete(name("JavaScript")); }
}
