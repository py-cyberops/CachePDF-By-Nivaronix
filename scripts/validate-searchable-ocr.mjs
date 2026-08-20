import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9444";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const fixture = "/home/ubuntu/cachepdf-validation/cachepdf-ocr-fixture.pdf";
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const downloadDirectory = `${outputDirectory}/searchable-pdf-download`;

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map(); let messageId = 0;
    socket.addEventListener("open", () => resolve({
      send(method, params = {}) { const id = ++messageId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage })); },
      close() { socket.close(); },
    }));
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); });
    socket.addEventListener("error", reject);
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (client, expression) => (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

await mkdir(outputDirectory, { recursive: true });
await rm(downloadDirectory, { recursive: true, force: true });
await mkdir(downloadDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);

try {
  await client.send("Page.enable"); await client.send("DOM.enable"); await client.send("Runtime.enable");
  await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDirectory, eventsEnabled: true });
  await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/make-pdf-searchable" }); await pause(1800);
  await evaluate(client, 'localStorage.setItem("cachepdf-theme-preference", "light")'); await client.send("Page.reload", { ignoreCache: true }); await pause(2000);
  const document = await client.send("DOM.getDocument", { depth: -1 });
  const query = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' });
  if (!query.nodeId) throw new Error("The searchable-PDF file input was not rendered.");
  await client.send("DOM.setFileInputFiles", { nodeId: query.nodeId, files: [fixture] }); await pause(1800);
  const clicked = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Create searchable PDF")); if (!button) return false; button.click(); return true; })()');
  if (!clicked) throw new Error("The searchable-PDF action button was not available after fixture load.");
  let completed = false;
  for (let attempt = 0; attempt < 70; attempt += 1) {
    await pause(2000);
    const bodyText = await evaluate(client, "document.body.innerText");
    if (typeof bodyText === "string" && bodyText.includes("Searchable PDF ready")) { completed = true; break; }
    if (typeof bodyText === "string" && bodyText.includes("could not complete")) throw new Error("The searchable-PDF workflow reported an error.");
  }
  if (!completed) throw new Error("Timed out while waiting for the browser-local searchable-PDF workflow.");
  const evidence = await evaluate(client, '(() => ({ ready: document.body.innerText.includes("Searchable PDF ready"), exportField: Boolean(document.querySelector("input[aria-label=\\"Searchable PDF export filename\\"]")), downloadButton: [...document.querySelectorAll("button")].some((item) => item.textContent?.includes("Export searchable PDF")) }))()');
  if (!evidence?.ready || !evidence?.exportField || !evidence?.downloadButton) throw new Error("The searchable-PDF ready state was incomplete.");
  const downloaded = await evaluate(client, '(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Export searchable PDF")); if (!button) return false; button.click(); return true; })()');
  if (!downloaded) throw new Error("The searchable-PDF download button was not available.");
  let downloadedFile = "";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await pause(250);
    const files = await readdir(downloadDirectory);
    downloadedFile = files.find((name) => name.endsWith(".pdf")) ?? "";
    if (downloadedFile) break;
  }
  if (!downloadedFile) throw new Error("The searchable-PDF download did not complete.");
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await writeFile(`${outputDirectory}/searchable-pdf-fixture-ready.png`, Buffer.from(screenshot.data, "base64"));
  await writeFile(`${outputDirectory}/searchable-pdf-fixture-validation.json`, JSON.stringify({ ...evidence, downloadedFile: `${downloadDirectory}/${downloadedFile}` }, null, 2));
  console.log(`Browser-local searchable-PDF fixture completed: ${downloadDirectory}/${downloadedFile}`);
} finally {
  client.close();
}
