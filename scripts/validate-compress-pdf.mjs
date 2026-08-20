import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9666";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const fixture = "/home/ubuntu/cachepdf-validation/cachepdf-compression-fixture.pdf";
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const downloadDirectory = `${outputDirectory}/compressed-pdf-download`;

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
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/compress-pdf" }); await pause(1800); await evaluate(client, 'localStorage.setItem("cachepdf-theme-preference", "light")'); await client.send("Page.reload", { ignoreCache: true }); await pause(1800);
  const document = await client.send("DOM.getDocument", { depth: -1 }); const query = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' }); if (!query.nodeId) throw new Error("The compress-PDF file input was not rendered."); await client.send("DOM.setFileInputFiles", { nodeId: query.nodeId, files: [fixture] }); await pause(1800);
  const profileSelected = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Smaller file")); if (!button) return false; button.click(); return true; })()'); if (!profileSelected) throw new Error("The smaller-file profile was not available.");
  const clicked = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === "Compress PDF"); if (!button) return false; button.click(); return true; })()'); if (!clicked) throw new Error("The compress-PDF action button was not available.");
  let completed = false; for (let attempt = 0; attempt < 80; attempt += 1) { await pause(1500); const text = await evaluate(client, "document.body.innerText"); if (typeof text === "string" && (text.includes("smaller") || text.includes("No size reduction achieved")) && text.includes("Export compressed PDF")) { completed = true; break; } if (typeof text === "string" && text.includes("could not complete")) throw new Error("The compression workflow reported an error."); } if (!completed) throw new Error("Timed out while waiting for the local compression workflow.");
  const evidence = await evaluate(client, '(() => ({ ready: [...document.querySelectorAll("button")].some((item) => item.textContent?.includes("Export compressed PDF")), exportField: Boolean(document.querySelector("input[aria-label=\\"Compressed PDF export filename\\"]")), status: document.body.innerText.includes("No size reduction achieved") ? "no-reduction" : "reduced" }))()'); if (!evidence?.ready || !evidence?.exportField) throw new Error("The compression ready state was incomplete.");
  const downloaded = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Export compressed PDF")); if (!button) return false; button.click(); return true; })()'); if (!downloaded) throw new Error("The compressed-PDF download button was not available."); let downloadedFile = ""; for (let attempt = 0; attempt < 20; attempt += 1) { await pause(250); downloadedFile = (await readdir(downloadDirectory)).find((name) => name.endsWith(".pdf")) ?? ""; if (downloadedFile) break; } if (!downloadedFile) throw new Error("The compressed-PDF download did not complete.");
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await writeFile(`${outputDirectory}/compress-pdf-fixture-ready.png`, Buffer.from(screenshot.data, "base64")); await writeFile(`${outputDirectory}/compress-pdf-fixture-validation.json`, JSON.stringify({ ...evidence, downloadedFile: `${downloadDirectory}/${downloadedFile}` }, null, 2)); console.log(`Browser-local compression fixture completed: ${downloadDirectory}/${downloadedFile}`);
} finally { client.close(); }
