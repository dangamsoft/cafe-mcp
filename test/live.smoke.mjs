// Manual smoke test against the real backend: node test/live.smoke.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";
const server = createServer();
const client = new Client({ name: "smoke", version: "0" });
const [a, b] = InMemoryTransport.createLinkedPair();
await Promise.all([server.connect(a), client.connect(b)]);
for (const name of ["saju_chart", "ohaeng_balance", "gyeokguk", "eumyang_johu", "yongshin_candidates"]) {
  const t0 = Date.now();
  const r = await client.callTool({ name, arguments: { birth: "1974-12-30T05:30", sex: "male" } });
  const sc = r.structuredContent || {};
  console.log(name, r.isError ? "ERROR " + JSON.stringify(sc.error) : `ok panels=${sc.data?.panel_count} basis=${(sc.basis || "").slice(0, 40).replace(/\n/g, " ")}`, `${Date.now() - t0}ms`);
}
process.exit(0);
