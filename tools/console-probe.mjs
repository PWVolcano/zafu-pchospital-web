/* 收集页面上所有的 console 调用与运行时异常。
   用法：node tools/console-probe.mjs <url> [宽] [高] */
const [, , url, w = "1440", h = "900"] = process.argv;
const PORT = process.env.CDP_PORT || "9222";

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === "page");
if (!page) throw new Error("没有可用的页面目标");

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = new Map();

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  } else if (msg.method && events.has(msg.method)) {
    events.get(msg.method)();
    events.delete(msg.method);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const messages = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === "Runtime.consoleAPICalled") {
    const args = (m.params.args || [])
      .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
      .join(" ");
    messages.push(`[${m.params.type}] ${args}`.slice(0, 600));
  }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    messages.push(`[exception] ${(d.exception?.description || d.text || "").slice(0, 600)}`);
  }
});

const once = (method) => new Promise((r) => events.set(method, r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await new Promise((r) => ws.addEventListener("open", r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: +w,
  height: +h,
  deviceScaleFactor: 1,
  mobile: false,
});

const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url });
await Promise.race([loaded, sleep(9000)]);
await sleep(2500);

console.log("CONSOLE_MESSAGES " + JSON.stringify(messages, null, 2));
ws.close();
