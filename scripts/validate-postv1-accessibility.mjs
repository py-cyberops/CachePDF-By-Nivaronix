import { mkdir, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9888";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const routes = [
  "/make-pdf-searchable", "/sign-pdf", "/compress-pdf", "/document-privacy-check",
  "/tools/make-pdf-searchable", "/tools/sign-pdf", "/tools/compress-pdf", "/tools/document-privacy-check",
];

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url); const pending = new Map(); let messageId = 0;
    socket.addEventListener("open", () => resolve({ send(method, params = {}) { const id = ++messageId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage })); }, close() { socket.close(); } }));
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); }); socket.addEventListener("error", reject);
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (client, expression) => (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
const focusName = (client) => evaluate(client, '(() => { const element = document.activeElement; return element ? (element.getAttribute("aria-label") || element.textContent?.trim() || element.getAttribute("name") || element.tagName) : ""; })()');

await mkdir(outputDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);
const results = [];
try {
  await client.send("Page.enable"); await client.send("Runtime.enable"); await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const route of routes) {
    await client.send("Page.navigate", { url: `http://localhost:3000${route}` }); await pause(1600);
    const semantic = await evaluate(client, `(() => {
      const visible = (element) => { const style = getComputedStyle(element); const box = element.getBoundingClientRect(); return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0; };
      const accessibleName = (element) => element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent?.trim() || (element instanceof HTMLInputElement ? element.labels?.[0]?.textContent?.trim() || element.placeholder : "") || "";
      const controls = [...document.querySelectorAll("a,button,input,select,textarea")].filter(visible).map((element) => ({ tag: element.tagName.toLowerCase(), name: accessibleName(element), disabled: element instanceof HTMLButtonElement && element.disabled }));
      return { h1: document.querySelector("h1")?.textContent?.trim() || "", main: Boolean(document.querySelector("main")), unnamed: controls.filter((control) => !control.name && !control.disabled), controls };
    })()`);
    const keyboard = [];
    await evaluate(client, "document.body.focus()");
    for (let index = 0; index < 8; index += 1) { await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await pause(40); keyboard.push(await focusName(client)); }
    const reachable = [...new Set(keyboard.filter(Boolean))];
    const outcome = { route, h1: semantic?.h1, hasMain: semantic?.main, unnamed: semantic?.unnamed, keyboard: reachable };
    if (!outcome.h1 || !outcome.hasMain || outcome.unnamed.length || outcome.keyboard.length < 3) throw new Error(`Accessibility validation failed for ${route}: ${JSON.stringify(outcome)}`);
    results.push(outcome);
  }
  await writeFile(`${outputDirectory}/postv1-accessibility-validation.json`, JSON.stringify(results, null, 2));
  console.log(`Validated accessible structure, named controls, and keyboard reachability across ${results.length} CachePDF post-V1 routes.`);
} finally { client.close(); }
