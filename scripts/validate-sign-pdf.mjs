import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9555";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const fixture = "/home/ubuntu/cachepdf-validation/cachepdf-ocr-fixture.pdf";
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const downloadDirectory = `${outputDirectory}/signed-pdf-download`;

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url); const pending = new Map(); let messageId = 0;
    socket.addEventListener("open", () => resolve({ send(method, params = {}) { const id = ++messageId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage })); }, close() { socket.close(); } }));
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); }); socket.addEventListener("error", reject);
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (client, expression) => (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

await mkdir(outputDirectory, { recursive: true }); await rm(downloadDirectory, { recursive: true, force: true }); await mkdir(downloadDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);

try {
  await client.send("Page.enable"); await client.send("DOM.enable"); await client.send("Runtime.enable"); await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDirectory, eventsEnabled: true });
  await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/sign-pdf" }); await pause(1800); await evaluate(client, 'localStorage.setItem("cachepdf-theme-preference", "light")'); await client.send("Page.reload", { ignoreCache: true }); await pause(1800);
  const document = await client.send("DOM.getDocument", { depth: -1 }); const query = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' }); if (!query.nodeId) throw new Error("The sign-PDF file input was not rendered."); await client.send("DOM.setFileInputFiles", { nodeId: query.nodeId, files: [fixture] }); await pause(1800);
  const typed = await evaluate(client, '(() => { const input = document.querySelector("input[placeholder=\\"Type your name\\"]"); if (!input) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; setter.call(input, "CachePDF Signer"); input.dispatchEvent(new Event("input", { bubbles: true })); return true; })()'); if (!typed) throw new Error("The typed signature field was not available."); await pause(300);
  const clicked = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Place signature")); if (!button) return false; button.click(); return true; })()'); if (!clicked) throw new Error("The place-signature action button was not available.");
  let completed = false; for (let attempt = 0; attempt < 30; attempt += 1) { await pause(500); const text = await evaluate(client, "document.body.innerText"); if (typeof text === "string" && text.includes("Signed PDF ready")) { completed = true; break; } if (typeof text === "string" && text.includes("could not complete")) throw new Error("The sign-PDF workflow reported an error."); } if (!completed) throw new Error("Timed out while waiting for the local signature workflow.");
  const evidence = await evaluate(client, '(() => ({ ready: document.body.innerText.includes("Signed PDF ready"), exportField: Boolean(document.querySelector("input[aria-label=\\"Signed PDF export filename\\"]")), downloadButton: [...document.querySelectorAll("button")].some((item) => item.textContent?.includes("Export signed PDF")) }))()'); if (!evidence?.ready || !evidence?.exportField || !evidence?.downloadButton) throw new Error("The signed-PDF ready state was incomplete.");
  const downloaded = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Export signed PDF")); if (!button) return false; button.click(); return true; })()'); if (!downloaded) throw new Error("The signed-PDF download button was not available.");
  let downloadedFile = ""; for (let attempt = 0; attempt < 20; attempt += 1) { await pause(250); downloadedFile = (await readdir(downloadDirectory)).find((name) => name.endsWith(".pdf")) ?? ""; if (downloadedFile) break; } if (!downloadedFile) throw new Error("The signed-PDF download did not complete.");
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await writeFile(`${outputDirectory}/sign-pdf-fixture-ready.png`, Buffer.from(screenshot.data, "base64")); await writeFile(`${outputDirectory}/sign-pdf-fixture-validation.json`, JSON.stringify({ ...evidence, downloadedFile: `${downloadDirectory}/${downloadedFile}` }, null, 2)); console.log(`Browser-local sign-PDF fixture completed: ${downloadDirectory}/${downloadedFile}`);
} finally { client.close(); }
