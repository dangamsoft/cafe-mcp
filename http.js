#!/usr/bin/env node
/**
 * @dangamsoft/cafe-mcp — remote entry (MCP Streamable HTTP, stateless).
 *
 *   POST /mcp     MCP endpoint (JSON responses, no sessions, no auth: free read-only tools)
 *   GET  /health  liveness for the reverse proxy
 *   GET  /        short service info
 *
 * Env: PORT (8787), HOST (127.0.0.1), TRUST_PROXY=1 behind nginx, RATE_LIMIT_PER_MIN (120),
 *      CAFE_MCP_API_URL (engine base URL). Request bodies are never logged.
 */
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, PKG, CONTRACT } from "./server.js";

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || "127.0.0.1";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN) || 120;
const MAX_BODY = 64 * 1024;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function send(res, status, obj, extra = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS, ...extra });
  res.end(JSON.stringify(obj));
}
const rpcError = (code, message) => ({ jsonrpc: "2.0", error: { code, message }, id: null });

/* fixed one-minute window per client IP */
const hits = new Map();
let windowStart = Date.now();
function allow(ip) {
  const now = Date.now();
  if (now - windowStart >= 60_000) { hits.clear(); windowStart = now; }
  const n = (hits.get(ip) || 0) + 1;
  hits.set(ip, n);
  return n <= LIMIT;
}
function clientIp(req) {
  if (TRUST_PROXY) {
    const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (xff) return xff;
    if (req.headers["x-real-ip"]) return String(req.headers["x-real-ip"]);
  }
  return req.socket.remoteAddress || "unknown";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error("too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleMcp(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch (e) {
    if (e.status === 413) return send(res, 413, rpcError(-32600, "Request too large."));
    return send(res, 400, rpcError(-32700, "Parse error: body must be JSON-RPC."));
  }
  // Stateless: one server + transport per request, closed with the response.
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close(); server.close(); });
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

const httpServer = http.createServer(async (req, res) => {
  const t0 = Date.now();
  const path = (req.url || "/").split("?")[0];
  res.on("finish", () => {
    console.log(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${Date.now() - t0}ms`);
  });
  try {
    if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
    if (path === "/health") return send(res, 200, { ok: true, name: PKG.name, version: PKG.version, contract: CONTRACT });
    if (path === "/" && req.method === "GET") {
      return send(res, 200, {
        name: PKG.name, version: PKG.version, contract: CONTRACT,
        mcp: "/mcp (Streamable HTTP, POST)", docs: "https://github.com/dangamsoft/cafe-mcp", web: "https://24plus.ai.kr",
      });
    }
    if (path === "/mcp") {
      if (req.method !== "POST") return send(res, 405, rpcError(-32000, "Method not allowed. This server is stateless: use POST."), { Allow: "POST, OPTIONS" });
      if (!allow(clientIp(req))) return send(res, 429, rpcError(-32000, "Rate limit reached. Try again in a minute."), { "Retry-After": "60" });
      return await handleMcp(req, res);
    }
    return send(res, 404, { error: "not_found" });
  } catch (e) {
    console.error(`[cafe-mcp http] ${e && e.message}`);
    if (!res.headersSent) send(res, 500, rpcError(-32603, "Internal error."));
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[cafe-mcp ${PKG.version}] Streamable HTTP on http://${HOST}:${PORT}/mcp (limit ${LIMIT}/min/ip, trust_proxy=${TRUST_PROXY})`);
});
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => httpServer.close(() => process.exit(0)));
}
