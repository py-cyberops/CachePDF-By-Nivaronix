import { mkdir, writeFile } from "node:fs/promises";

const debugPort = process.env.CACHEPDF_CDP_PORT || "9333";
const debugOrigin = `http://127.0.0.1:${debugPort}`;
const appUrl = "http://localhost:3000/tools";
const outputDirectory = "/home/ubuntu/cachepdf-validation";

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    let messageId = 0;
    socket.addEventListener("open", () => resolve({
      send(method, params = {}) {
        const id = ++messageId;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((resolveMessage, rejectMessage) => pending.set(id, { resolve: resolveMessage, reject: rejectMessage }));
      },
      close() { socket.close(); },
    }));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
    socket.addEventListener("error", reject);
  });
}

async function pause(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function capture(client, name, preference, density, systemTheme) {
  await client.send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-color-scheme", value: systemTheme }],
  });
  await client.send("Page.navigate", { url: appUrl });
  await pause(1400);
  await client.send("Runtime.evaluate", {
    expression: `localStorage.setItem("cachepdf-theme-preference", ${JSON.stringify(preference)}); localStorage.setItem("cachepdf-density", ${JSON.stringify(density)});`,
  });
  await client.send("Page.reload", { ignoreCache: true });
  await pause(2400);
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(`${outputDirectory}/${name}.png`, Buffer.from(screenshot.data, "base64"));
}

async function captureHoveredCard(client, name, url) {
  await client.send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: "light" }] });
  await client.send("Page.navigate", { url });
  await pause(1400);
  await client.send("Runtime.evaluate", { expression: 'localStorage.setItem("cachepdf-theme-preference", "light"); localStorage.setItem("cachepdf-density", "comfortable");' });
  await client.send("Page.reload", { ignoreCache: true });
  await pause(2400);
  const geometry = await client.send("Runtime.evaluate", {
    expression: `(() => { const card = document.querySelector(".tool-card"); if (!card) return null; card.scrollIntoView({ block: "center" }); const rect = card.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`,
    returnByValue: true,
  });
  const point = geometry.result.value;
  if (!point) throw new Error(`No .tool-card was available at ${url}`);
  await pause(300);
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y, button: "none" });
  await pause(300);
  const computed = await client.send("Runtime.evaluate", {
    expression: `(() => { const card = document.querySelector(".tool-card:hover"); if (!card) return null; const style = getComputedStyle(card); const heading = card.querySelector("h2, h3"); const body = card.querySelector("p"); return { background: style.backgroundImage || style.backgroundColor, color: style.color, heading: heading ? getComputedStyle(heading).color : null, body: body ? getComputedStyle(body).color : null }; })()`,
    returnByValue: true,
  });
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(`${outputDirectory}/${name}.png`, Buffer.from(screenshot.data, "base64"));
  await writeFile(`${outputDirectory}/${name}.json`, JSON.stringify(computed.result.value, null, 2));
}

await mkdir(outputDirectory, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
const client = await connect(target.webSocketDebuggerUrl);

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await capture(client, "light-comfortable-tools", "light", "comfortable", "light");
  await capture(client, "dark-comfortable-tools", "dark", "comfortable", "light");
  await capture(client, "system-dark-comfortable-tools", "system", "comfortable", "dark");
  await capture(client, "light-compact-tools", "light", "compact", "light");
  await captureHoveredCard(client, "light-hover-tools-directory", "http://localhost:3000/tools");
  await captureHoveredCard(client, "light-hover-home-modes", "http://localhost:3000/");
  console.log("Captured CachePDF theme, density, and real light-mode card hover evidence.");
} finally {
  client.close();
}
