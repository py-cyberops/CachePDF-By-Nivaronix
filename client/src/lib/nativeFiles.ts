import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

type NativeDocument = { uri: string; name: string; mimeType: string };
type NativeDocumentPlugin = {
  pickDocument: () => Promise<NativeDocument>;
  consumeIncomingDocument: () => Promise<NativeDocument | null>;
};

const NativeDocument = registerPlugin<NativeDocumentPlugin>("NativeDocument");
export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

function bytesFromBase64(base64: string) {
  const binary = atob(base64); const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function readNativeDocument(document: NativeDocument): Promise<File> {
  const data = await Filesystem.readFile({ path: document.uri });
  if (typeof data.data !== "string") throw new Error("The selected Android document could not be read locally.");
  return new File([bytesFromBase64(data.data)], document.name || "cachepdf-document", { type: document.mimeType || "application/octet-stream" });
}

export async function pickNativeDocument() {
  if (!isNativeAndroid()) return null;
  return NativeDocument.pickDocument();
}

export async function consumeNativeIncomingDocument() {
  if (!isNativeAndroid()) return null;
  return NativeDocument.consumeIncomingDocument();
}

export async function shareNativeExport(title: string, filename: string, blob: Blob) {
  if (!isNativeAndroid()) return false;
  const base64 = await blobToBase64(blob);
  const saved = await Filesystem.writeFile({ path: `exports/${filename}`, data: base64, recursive: true });
  await Share.share({ title, files: [saved.uri], dialogTitle: title });
  return true;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}
