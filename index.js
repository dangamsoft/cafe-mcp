#!/usr/bin/env node
/** @dangamsoft/cafe-mcp — stdio entry. Server definition lives in server.js. */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, PKG } from "./server.js";

const server = createServer();
await server.connect(new StdioServerTransport());
// stderr only: stdout carries the MCP protocol stream.
console.error(`[cafe-mcp ${PKG.version}] ready`);
