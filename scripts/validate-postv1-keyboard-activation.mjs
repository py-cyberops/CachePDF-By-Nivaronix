import { mkdir, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9999";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const outputDirectory = "/home/ubuntu/cachepdf-validation";
const landings = ["/make-pdf-searchable", "/sign-pdf", "/compress-pdf", "/document-privacy-check"];
const workspaces = ["/tools/make-pdf-searchable", "/tools/sign-pdf", "/tools/compress-pdf", "/tools/document-privacy-check"];

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url); const pending = new Map(); let messageId = 0;
    socket.addEventListener("open", () => resolve({ send(method, params = {}) { const id = ++messageId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage })); }, close() { socket.close(); } }));
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); }); socket.addEventListener("error", reject);
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (client, expression) => (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
const activateEnter = async (client) => { await client.send("Page.bringToFront"); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", text: "\r", unmodifiedText: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }); await pause(25); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }); await pause(80); };

await mkdir(outputDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);
const results = [];
try {
  await client.send("Page.enable"); await client.send("Runtime.enable"); await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const route of landings) {
    await client.send("Page.navigate", { url: `http://localhost:3000${route}` }); await pause(1500);
    await evaluate(client, "document.body.tabIndex = -1; document.body.focus()"); await activateEnter(client); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await pause(40);
    const prepared = await evaluate(client, `(() => { const link = [...document.querySelectorAll("a")].find((item) => item.textContent?.includes("OPEN TOOL")); if (!link) return null; window.__cachePdfActivated = false; link.addEventListener("click", (event) => { event.preventDefault(); window.__cachePdfActivated = true; }, { once: true }); link.focus(); const style = getComputedStyle(link); return { tag: link.tagName, focusVisible: link.matches(":focus-visible"), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, label: link.textContent?.trim() }; })()`);
    if (!prepared?.focusVisible || prepared.outlineStyle !== "solid" || Number.parseFloat(prepared.outlineWidth) < 2) throw new Error(`Landing focus indicator failed for ${route}: ${JSON.stringify(prepared)}`);
    await activateEnter(client); const activated = await evaluate(client, "window.__cachePdfActivated === true"); if (!activated) throw new Error(`Landing Enter activation failed for ${route}`); results.push({ route, kind: "landing", ...prepared, activated });
  }
  for (const route of workspaces) {
    await client.send("Page.navigate", { url: `http://localhost:3000${route}` }); await pause(1500);
    await evaluate(client, "document.body.tabIndex = -1; document.body.focus()"); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await pause(40);
    const prepared = await evaluate(client, `(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Choose PDF")); if (!button) return null; window.__cachePdfActivated = false; button.addEventListener("click", () => { window.__cachePdfActivated = true; }, { once: true, capture: true }); button.focus(); const style = getComputedStyle(button); return { tag: button.tagName, focusVisible: button.matches(":focus-visible"), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, label: button.textContent?.trim() }; })()`);
    if (!prepared?.focusVisible || prepared.outlineStyle !== "solid" || Number.parseFloat(prepared.outlineWidth) < 2) throw new Error(`Workspace focus indicator failed for ${route}: ${JSON.stringify(prepared)}`);
    await activateEnter(client); const activated = await evaluate(client, "window.__cachePdfActivated === true"); if (!activated) throw new Error(`Workspace Enter activation failed for ${route}`); results.push({ route, kind: "workspace", ...prepared, activated });
  }
  await writeFile(`${outputDirectory}/postv1-keyboard-activation-validation.json`, JSON.stringify(results, null, 2));
  console.log(`Validated visible focus and Enter activation across ${results.length} CachePDF post-V1 primary controls.`);
} finally { client.close(); }
