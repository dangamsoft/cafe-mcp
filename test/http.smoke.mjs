// Remote smoke: starts http.js, connects with the SDK Streamable HTTP client, calls tools.
// Usage: node test/http.smoke.mjs            (uses the live engine)
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const PORT = 18787;
const child = spawn(process.execPath, ["http.js"], { env: { ...process.env, PORT: String(PORT), RATE_LIMIT_PER_MIN: "8" }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((r) => child.stdout.once("data", r));
const base = `http://127.0.0.1:${PORT}`;
let failed = 0;
const check = (name, ok, info = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name} ${info}`); if (!ok) failed++; };
try {
  const h = await (await fetch(`${base}/health`)).json();
  check("health", h.ok === true, h.version);
  check("GET /mcp is 405", (await fetch(`${base}/mcp`)).status === 405);
  check("bad JSON is 400", (await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{" })).status === 400);

  const client = new Client({ name: "http-smoke", version: "0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
  const { tools } = await client.listTools();
  check("tools/list", tools.length === 6, tools.map((t) => t.name).join(","));
  let t = Date.now();
  const r1 = await client.callTool({ name: "saju_chart", arguments: { birth: "1990-01-15T10:30", sex: "male" } });
  check("saju_chart", !r1.isError && r1.structuredContent?.engine === "cafe", `${Date.now() - t}ms`);
  t = Date.now();
  const r2 = await client.callTool({ name: "manse_calendar", arguments: {} });
  check("manse_calendar", !r2.isError && r2.structuredContent?.days?.length >= 28, `${Date.now() - t}ms`);
  const r3 = await client.callTool({ name: "saju_chart", arguments: { birth: "2026-02-30T10:00", sex: "male" } });
  check("invalid_input", r3.isError && JSON.parse(r3.content[1].text).error.code === "invalid_input");
  await client.close();

  let limited = false;
  for (let i = 0; i < 10 && !limited; i++) {
    const s = (await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) })).status;
    limited = s === 429;
  }
  check("rate limit -> 429", limited);
} catch (e) {
  check("exception", false, e.message);
} finally {
  child.kill();
}
process.exit(failed ? 1 : 0);
