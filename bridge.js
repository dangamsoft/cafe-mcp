/**
 * @dangamsoft/cafe-mcp 2.x — stdio bridge to the remote 24PLUS MCP server (2026-11-22).
 *   Clients that only start local (stdio) servers run `npx @dangamsoft/cafe-mcp` and get the same tools as
 *   https://mcp.24plus.ai.kr/mcp. Nothing is calculated locally: every request goes to the remote server with
 *   the user's personal key (CAFE_MCP_KEY = mcp_live_..., from https://24plus.ai.kr/my).
 *   Without a key the bridge still starts and lists one `cafe_mcp_setup` tool that explains how to get one.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";

const PKG = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
export const REMOTE_URL = process.env.CAFE_MCP_URL || "https://mcp.24plus.ai.kr/mcp";
const KEY_PAGE = "https://24plus.ai.kr/my";

/** Key from env (CAFE_MCP_KEY, or the older names) or `--key mcp_live_...`. */
export function readKey(argv = process.argv, env = process.env) {
  const i = argv.indexOf("--key");
  const k = (i >= 0 ? argv[i + 1] : "") || env.CAFE_MCP_KEY || env.MCP_24PLUS_KEY || "";
  return k.trim();
}

export const SETUP_TOOL = {
  name: "cafe_mcp_setup",
  description: "cafe-mcp needs a free 24PLUS key before the Saju tools appear. Call this to show the user how to set it up.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true },
};

export function setupText(reason = "") {
  return [
    reason ? `${reason}\n` : "",
    "cafe-mcp (Saju & BaZi charts by the CAFE engine) runs on the 24PLUS server and is free with a 24PLUS account.",
    `1. Sign in at ${KEY_PAGE} and create a personal key (mcp_live_...).`,
    "2. Add it to this server's settings, e.g.",
    '   { "mcpServers": { "cafe-mcp": { "command": "npx", "args": ["-y", "@dangamsoft/cafe-mcp"], "env": { "CAFE_MCP_KEY": "mcp_live_..." } } } }',
    "3. Restart the client. Clients that support remote servers can instead add https://mcp.24plus.ai.kr/mcp and sign in, no key needed.",
  ].join("\n");
}

/** 2026-11-22 맛보기: 키 없이도 엔진 결과가 어떤지 보이게 — 미리 계산해 둔 경계 사례(boundary-cases/cases.json, 엔진 결과)를 보여 준다. 새 계산은 하지 않는다 */
export const SAMPLE_TOOL = {
  name: "cafe_mcp_sample",
  description: "Show real CAFE engine results for tricky births computed in advance (a birth minutes before Lichun, around midnight, in a daylight-saving year, outside Korea), with the basis the engine used. No key needed. To compute any other birth, the user needs a free 24PLUS key (see cafe_mcp_setup).",
  inputSchema: { type: "object", properties: { topic: { type: "string", enum: ["year_boundary", "rat_hour", "daylight_saving", "longitude", "all"], description: "Which kind of case to show (default all)." } } },
  annotations: { readOnlyHint: true },
};
const TOPIC = { year_boundary: ["ipchun", "dongji"], rat_hour: ["zi"], daylight_saving: ["dst"], longitude: ["lmt", "tz"] };

export function sampleText(topic = "all") {
  let data;
  try { data = JSON.parse(readFileSync(new URL("./boundary-cases/cases.json", import.meta.url), "utf8")); }
  catch { return setupText(); }
  const pre = TOPIC[topic] ?? Object.values(TOPIC).flat();
  const picked = [];
  for (const p of pre) { const c = data.cases.find((x) => x.id.startsWith(p + "-") && !picked.includes(x)); if (c) picked.push(c); }
  const lines = [`Sample results from the ${data.engine} engine, computed in advance (rules: year ${data.defaults.year_boundary}, Rat hour ${data.defaults.zi_hour}, Korean longitude correction ${data.defaults.korea_time ? "on" : "off"}).`, ""];
  for (const c of picked) {
    const r = c.result || {};
    const b = String(c.subject?.birth || "");
    const when = b.length >= 12 ? `${b.slice(0, 4)}-${b.slice(4, 6)}-${b.slice(6, 8)} ${b.slice(8, 10)}:${b.slice(10, 12)}` : b;
    lines.push(`- ${c.topic} · birth ${when}${c.subject?.gender ? " " + c.subject.gender : ""}: year ${r.year ?? "-"}, month ${r.month ?? "-"}, day ${r.day ?? "-"}, hour ${r.hour ?? "-"}`
      + (r.time_note ? ` (time basis: ${r.time_note.basis ?? ""}, correction ${r.time_note.correction_min ?? 0} min, DST ${r.time_note.dst_min ?? 0} min)` : ""));
  }
  if (data.defaults.zi_hour === "late") lines.push("", "Note: these examples use the late Rat hour (야자시). Since 2.0 the server defaults to early (조자시); pass zi_hour \"late\" to get the results above.");
  lines.push("", "These are fixed examples. To compute any birth (full chart, luck cycles, calendar, classics), get a free key:", setupText());
  return lines.join("\n");
}

const authFail = (e) => /401|403|unauthori[sz]ed|forbidden|invalid[_ ]token/i.test(String(e?.message ?? e));

export function createBridge({ key = readKey(), url = REMOTE_URL, transportFactory } = {}) {
  let remote = null;
  let connecting = null;
  const connect = async () => {
    if (remote) return remote;
    connecting ??= (async () => {
      const t = transportFactory ? transportFactory() : new StreamableHTTPClientTransport(new URL(url), {
        requestInit: { headers: { Authorization: `Bearer ${key}`, "User-Agent": `cafe-mcp-bridge/${PKG.version}` } },
      });
      const c = new Client({ name: "cafe-mcp-bridge", version: PKG.version });
      await c.connect(t);
      remote = c;
      return c;
    })().catch((e) => { connecting = null; throw e; });
    return connecting;
  };

  const server = new Server(
    { name: "cafe-mcp", version: PKG.version },
    { capabilities: { tools: {}, prompts: {} }, instructions: "Saju & BaZi tools from the CAFE engine (24PLUS). Values are computed on the 24PLUS server." },
  );

  server.setRequestHandler(ListToolsRequestSchema, async (req) => {
    if (!key) return { tools: [SAMPLE_TOOL, SETUP_TOOL] };
    try { return await (await connect()).listTools(req.params); }
    catch (e) { return { tools: [{ ...SETUP_TOOL, description: `cafe-mcp could not reach the 24PLUS server (${authFail(e) ? "the key was not accepted" : "network error"}). Call this for help.` }] }; }
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name === SAMPLE_TOOL.name) {
      return { content: [{ type: "text", text: sampleText(req.params.arguments?.topic) }] };
    }
    if (req.params.name === SETUP_TOOL.name || !key) {
      return { content: [{ type: "text", text: setupText(key ? "" : "No key is set yet.") }] };
    }
    try { return await (await connect()).callTool(req.params); }
    catch (e) {
      const msg = authFail(e) ? setupText("The 24PLUS server did not accept the key (it may be revoked or mistyped).")
        : `cafe-mcp could not reach ${url}: ${String(e?.message ?? e).slice(0, 200)}. Try again in a moment.`;
      return { isError: true, content: [{ type: "text", text: msg }] };
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async (req) => {
    if (!key) return { prompts: [] };
    try { return await (await connect()).listPrompts(req.params); } catch { return { prompts: [] }; }
  });
  server.setRequestHandler(GetPromptRequestSchema, async (req) => (await connect()).getPrompt(req.params));

  return { server, close: async () => { await remote?.close().catch(() => {}); } };
}

export async function main() {
  const key = readKey();
  const { server } = createBridge({ key });
  await server.connect(new StdioServerTransport());
  // stderr only: stdout carries the MCP protocol stream.
  console.error(`[cafe-mcp ${PKG.version}] bridge to ${REMOTE_URL}${key ? "" : " — no key yet (set CAFE_MCP_KEY, see " + KEY_PAGE + ")"}`);
}
