import { mkdir, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "10001";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const fixture = "/home/ubuntu/cachepdf-validation/cachepdf-ocr-fixture.pdf";
const outputDirectory = "/home/ubuntu/cachepdf-validation";

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url); const pending = new Map(); let messageId = 0;
    socket.addEventListener("open", () => resolve({ send(method, params = {}) { const id = ++messageId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage })); }, close() { socket.close(); } }));
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); }); socket.addEventListener("error", reject);
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (client, expression) => (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
async function keyboardMode(client) { await evaluate(client, "document.body.tabIndex = -1; document.body.focus()"); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await pause(40); }
async function press(client, key, code, keyCode, text = "") { await client.send("Page.bringToFront"); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text, unmodifiedText: text, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); await pause(25); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); await pause(80); }
async function setFixture(client) { const document = await client.send("DOM.getDocument", { depth: -1 }); const query = await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' }); if (!query.nodeId) throw new Error("File input unavailable."); await client.send("DOM.setFileInputFiles", { nodeId: query.nodeId, files: [fixture] }); await pause(1500); }
async function assertButtonActivation(client, selectorExpression, label) {
  await keyboardMode(client);
  const prepared = await evaluate(client, `(() => { const target = ${selectorExpression}; if (!target) return null; window.__cachePdfSecondaryActivation = false; target.addEventListener("click", () => { window.__cachePdfSecondaryActivation = true; }, { once: true, capture: true }); target.focus(); const style = getComputedStyle(target); return { focusVisible: target.matches(":focus-visible"), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, label: target.getAttribute("aria-label") || target.getAttribute("title") || target.textContent?.trim() }; })()`);
  if (!prepared?.focusVisible || prepared.outlineStyle !== "solid" || Number.parseFloat(prepared.outlineWidth) < 2) throw new Error(`Visible focus failed for ${label}: ${JSON.stringify(prepared)}`);
  await press(client, "Enter", "Enter", 13, "\r"); const activated = await evaluate(client, "window.__cachePdfSecondaryActivation === true"); if (!activated) throw new Error(`Enter activation failed for ${label}`); return { label, ...prepared, activated };
}

await mkdir(outputDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);
const results = [];
try {
  await client.send("Page.enable"); await client.send("DOM.enable"); await client.send("Runtime.enable"); await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/make-pdf-searchable" }); await pause(1500); await setFixture(client); results.push(await assertButtonActivation(client, '[...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Replace"))', "Searchable PDF replace action")); results.push(await assertButtonActivation(client, 'document.querySelector(".density-control button[title=\\"Compact spacing\\"]")', "Searchable PDF compact density"));
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/sign-pdf" }); await pause(1500); await setFixture(client); results.push(await assertButtonActivation(client, '[...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === "draw")', "Sign PDF draw method")); results.push(await assertButtonActivation(client, 'document.querySelector(".density-control button[title=\\"Compact spacing\\"]")', "Sign PDF compact density"));
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/compress-pdf" }); await pause(1500); await setFixture(client); results.push(await assertButtonActivation(client, '[...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Smaller file"))', "Compress PDF smaller-file profile")); results.push(await assertButtonActivation(client, 'document.querySelector(".density-control button[title=\\"Compact spacing\\"]")', "Compress PDF compact density"));
  await client.send("Page.navigate", { url: "http://localhost:3000/tools/document-privacy-check" }); await pause(1500); await setFixture(client); results.push(await assertButtonActivation(client, 'document.querySelector("[role=checkbox]")', "Privacy Check cleanup selection")); results.push(await assertButtonActivation(client, 'document.querySelector(".density-control button[title=\\"Compact spacing\\"]")', "Privacy Check compact density"));
  await writeFile(`${outputDirectory}/postv1-secondary-keyboard-validation.json`, JSON.stringify(results, null, 2)); console.log(`Validated visible focus and keyboard activation across ${results.length} CachePDF post-V1 secondary controls.`);
} finally { client.close(); }
