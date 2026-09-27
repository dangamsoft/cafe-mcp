// Load-guard smoke (1.0.1): stub engine that answers slowly, then check concurrency, daily cap, browser redirect.
import http from "node:http";
import { spawn } from "node:child_process";

const stub = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => setTimeout(() => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, preset_label: "x", panel_count: 0, panels: [], basis: "stub" }));
  }, 1500));
}).listen(18999);

const env = { ...process.env, PORT: "18998", CAFE_MCP_API_URL: "http://127.0.0.1:18999", MAX_CONCURRENT_CALLS: "3", DAILY_CALL_LIMIT: "6", RATE_LIMIT_PER_MIN: "100" };
const srv = spawn(process.execPath, ["http.js"], { env, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((r) => srv.stdout.once("data", r));

const U = "http://127.0.0.1:18998/mcp";
const call = (i) => fetch(U, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: i, method: "tools/call", params: { name: "saju_chart", arguments: { birth: "1990-01-15T10:30", sex: "male" } } }) }).then((r) => r.status);
let fail = 0; const check = (c, m) => { console.log((c ? "ok  " : "FAIL") + " " + m); if (!c) fail++; };

const burst = await Promise.all([1, 2, 3, 4, 5].map(call));
check(burst.filter((s) => s === 200).length === 3 && burst.filter((s) => s === 503).length === 2, `5 at once -> 3 served, 2 busy (${burst})`);
const list = await fetch(U, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/list" }) }).then((r) => r.status);
check(list === 200, "tools/list not counted");
const more = [await call(6), await call(7), await call(8), await call(9)];
check(more.join() === "200,200,200,429", `daily cap 6 -> ${more}`);
const g = await fetch(U, { headers: { Accept: "text/html" }, redirect: "manual" });
check(g.status === 302 && /github/.test(g.headers.get("location") || ""), "browser GET -> docs");
const h = await fetch("http://127.0.0.1:18998/health").then((r) => r.json());
check(h.in_flight === 0 && h.calls_today === 6, `health ${JSON.stringify(h)}`);
srv.kill(); stub.close();
process.exit(fail ? 1 : 0);
