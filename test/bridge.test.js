// 2026-11-22 stdio bridge (2.x): key handling, the no-key setup tool, and forwarding to a remote server.
import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { createBridge, readKey, SETUP_TOOL } from "../bridge.js";

async function clientFor(server) {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const c = new Client({ name: "t", version: "0" });
  await c.connect(b);
  return c;
}

test("readKey: --key wins, then CAFE_MCP_KEY", () => {
  assert.equal(readKey(["node", "index.js", "--key", "mcp_live_a"], { CAFE_MCP_KEY: "mcp_live_b" }), "mcp_live_a");
  assert.equal(readKey(["node", "index.js"], { CAFE_MCP_KEY: " mcp_live_b " }), "mcp_live_b");
  assert.equal(readKey(["node", "index.js"], {}), "");
});

test("no key: only the setup tool, and it explains how to get a key", async () => {
  const { server } = createBridge({ key: "" });
  const c = await clientFor(server);
  const { tools } = await c.listTools();
  assert.deepEqual(tools.map((t) => t.name), ["cafe_mcp_sample", SETUP_TOOL.name]);
  const s = await c.callTool({ name: "cafe_mcp_sample", arguments: { topic: "year_boundary" } });
  assert.match(s.content[0].text, /Lichun|ipchun/i);
  assert.match(s.content[0].text, /24plus\.ai\.kr\/my/);
  const r = await c.callTool({ name: "saju_chart", arguments: {} });
  assert.match(r.content[0].text, /24plus\.ai\.kr\/my/);
});

test("with a key: tools and calls are forwarded to the remote server", async () => {
  const remote = new McpServer({ name: "fake-gateway", version: "9" });
  remote.registerTool("saju_chart", { description: "chart", inputSchema: { birth_date: z.string() } },
    async ({ birth_date }) => ({ content: [{ type: "text", text: `chart ${birth_date}` }] }));
  const { server } = createBridge({
    key: "mcp_live_x",
    transportFactory: () => { const [a, b] = InMemoryTransport.createLinkedPair(); remote.connect(a); return b; },
  });
  const c = await clientFor(server);
  const { tools } = await c.listTools();
  assert.deepEqual(tools.map((t) => t.name), ["saju_chart"]);
  const r = await c.callTool({ name: "saju_chart", arguments: { birth_date: "1980-07-07" } });
  assert.equal(r.content[0].text, "chart 1980-07-07");
});
