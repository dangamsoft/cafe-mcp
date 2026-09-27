import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({ command: "node", args: ["index.js"], cwd: process.cwd() });
const c = new Client({ name: "stdio-smoke", version: "0" });
await c.connect(t);
const v = c.getServerVersion();
const { tools } = await c.listTools();
console.log(v.name, v.version, tools.map(x => x.name).join(","));
await c.close(); process.exit(0);
