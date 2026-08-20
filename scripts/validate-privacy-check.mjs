import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9777";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const fixture = "/home/ubuntu/cachepdf-validation/cachepdf-privacy-fixture.pdf";
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const downloadDirectory = `${outputDirectory}/privacy-check-download`;

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
  await client.send("Page.enable"); await client.send("DOM.enable"); await client.send("Runtime.enable"); await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDirectory, eventsEnabled: true }); await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/document-privacy-check" }); await pause(1800); await evaluate(client, 'localStorage.setItem("cachepdf-theme-preference", "light")'); await client.send("Page.reload", { ignoreCache: true }); await pause(1800);
  const document = await client.send("DOM.getDocument", { depth: -1 }); const query = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' }); if (!query.nodeId) throw new Error("The privacy-check file input was not rendered."); await client.send("DOM.setFileInputFiles", { nodeId: query.nodeId, files: [fixture] }); await pause(1800);
  const detected = await evaluate(client, 'document.body.innerText.includes("Common information fields or document dates are present.") && document.body.innerText.includes("Open, additional, or JavaScript document actions are present.")'); if (!detected) throw new Error("The controlled privacy findings were not shown.");
  const clicked = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Create cleaned PDF")); if (!button) return false; button.click(); return true; })()'); if (!clicked) throw new Error("The cleanup action button was not available.");
  let completed = false; for (let attempt = 0; attempt < 30; attempt += 1) { await pause(500); const text = await evaluate(client, "document.body.innerText"); if (typeof text === "string" && text.includes("Cleaned PDF ready to export")) { completed = true; break; } if (typeof text === "string" && text.includes("could not complete")) throw new Error("The privacy cleanup workflow reported an error."); } if (!completed) throw new Error("Timed out while waiting for local privacy cleanup.");
  const evidence = await evaluate(client, '(() => ({ ready: document.body.innerText.includes("Cleaned PDF ready to export"), exportField: Boolean(document.querySelector("input[aria-label=\\"Cleaned PDF export filename\\"]")), downloadButton: [...document.querySelectorAll("button")].some((item) => item.textContent?.includes("Export cleaned PDF")) }))()'); if (!evidence?.ready || !evidence?.exportField || !evidence?.downloadButton) throw new Error("The privacy cleanup ready state was incomplete.");
  const downloaded = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Export cleaned PDF")); if (!button) return false; button.click(); return true; })()'); if (!downloaded) throw new Error("The cleaned-PDF download button was not available."); let downloadedFile = ""; for (let attempt = 0; attempt < 20; attempt += 1) { await pause(250); downloadedFile = (await readdir(downloadDirectory)).find((name) => name.endsWith(".pdf")) ?? ""; if (downloadedFile) break; } if (!downloadedFile) throw new Error("The cleaned-PDF download did not complete.");
  const reinspectionDocument = await client.send("DOM.getDocument", { depth: -1 }); const reinspectionInput = await client.send("DOM.querySelector", { nodeId: reinspectionDocument.root.nodeId, selector: 'input[type="file"]' }); if (!reinspectionInput.nodeId) throw new Error("The privacy-check file input was unavailable for reinspection."); await client.send("DOM.setFileInputFiles", { nodeId: reinspectionInput.nodeId, files: [`${downloadDirectory}/${downloadedFile}`] }); await pause(1800);
  const rechecked = await evaluate(client, 'document.body.innerText.includes("No common information fields or document dates were found.") && document.body.innerText.includes("No common open, additional, or JavaScript actions were found.")'); if (!rechecked) throw new Error("The cleaned PDF still reported common metadata or document actions after reinspection.");
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await writeFile(`${outputDirectory}/privacy-check-fixture-ready.png`, Buffer.from(screenshot.data, "base64")); await writeFile(`${outputDirectory}/privacy-check-fixture-validation.json`, JSON.stringify({ ...evidence, downloadedFile: `${downloadDirectory}/${downloadedFile}`, rechecked }, null, 2)); console.log(`Browser-local privacy check fixture completed and rechecked: ${downloadDirectory}/${downloadedFile}`);
} finally { client.close(); }
