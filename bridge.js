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
    if (!key) return { tools: [SETUP_TOOL] };
    try { return await (await connect()).listTools(req.params); }
    catch (e) { return { tools: [{ ...SETUP_TOOL, description: `cafe-mcp could not reach the 24PLUS server (${authFail(e) ? "the key was not accepted" : "network error"}). Call this for help.` }] }; }
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
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
