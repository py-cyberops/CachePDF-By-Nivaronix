import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

type NativeDocument = { uri: string; name: string; mimeType: string };
type NativeDocumentPlugin = {
  pickDocument: () => Promise<NativeDocument>;
  consumeIncomingDocument: () => Promise<NativeDocument | null>;
  saveExport: (options: { filename: string; mimeType: string; sourceUri: string }) => Promise<void>;
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
  const path = `cachepdf-exports/${crypto.randomUUID()}-${filename}`;
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache, recursive: true });
  const source = await Filesystem.getUri({ path, directory: Directory.Cache });
  try { await NativeDocument.saveExport({ filename, mimeType: blob.type || "application/octet-stream", sourceUri: source.uri }); }
  finally { await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined); }
  return true;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}
