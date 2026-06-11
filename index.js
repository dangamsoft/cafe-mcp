#!/usr/bin/env node
/**
 * @dangamsoft/cafe-mcp — Korean Saju (四柱八字 / 사주명리) MCP server.
 *
 * A thin, stdio MCP server that exposes a FIXED set of 5 free analysis tools.
 * Each tool forwards to the 24Plus backend endpoint `POST /try/panels`, which
 * returns panel-extracted (safe) data only — never raw engine output.
 *
 * Design / safety invariants (do not weaken):
 *   1. Free-5 allowlist is HARD-CODED below (tool -> preset). There is NO
 *      generic "preset" parameter, so a client can never request a paid
 *      preset (yongshin / ncode / cafe_ucode / naming) through this server.
 *   2. The backend /try/panels gates on the 'try' channel AND returns only
 *      extracted panels (raw tool_result, AI-selected yongshin, model
 *      probabilities and the 91.1% metric are NOT included).
 *   3. No API key / engine / DB is bundled. This process only makes HTTPS
 *      calls to the public backend.
 *
 * Config:
 *   CAFE_MCP_API_URL  Base URL of the 24Plus backend (default below).
 *                     The server POSTs to `${CAFE_MCP_API_URL}/try/panels`.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = (process.env.CAFE_MCP_API_URL || "https://24plus.ai.kr/api").replace(/\/+$/, "");
const ENDPOINT = `${API_BASE}/try/panels`;
const REQUEST_TIMEOUT_MS = 15000;

// Appended as plain TEXT after the panels JSON on every successful tool
// response. This does NOT modify the backend payload or the `panels` data —
// the wrapper only adds an output-text line. Handled once here, not per-tool.
const FUNNEL_NOTE =
  "— 더 깊은 분석(AI 선정 용신 · 전체 리포트)은 https://24plus.ai.kr";

// Shared input schema for all 5 tools (birth chart inputs).
// v0.6.2 (2026-06-11): expose the chart options the backend already accepts
// (option1/option2/loc/is_leap_year/time_unknown) so MCP users with a
// Dongji-basis or Jo-jasi chart get the same chart as the web profile.
const BIRTH_INPUT = {
  type: "object",
  properties: {
    birth: {
      type: "string",
      description: "Birth date & time, 12 digits YYYYMMDDHHMM (e.g. 199001151030). Use 1230 for unknown time.",
    },
    gender: {
      type: "integer",
      enum: [0, 1],
      description: "Gender — 0: female, 1: male (CAFE convention).",
    },
    name: {
      type: "string",
      description: "Optional name. Affects some engine outputs; omit to use the default.",
    },
    is_lunar: {
      type: "boolean",
      description: "Optional. true if the birth date is a lunar-calendar date (default false = solar).",
    },
    is_leap_year: {
      type: "boolean",
      description: "Optional. true if the lunar birth month is a leap month (윤달). Only meaningful with is_lunar=true.",
    },
    option1: {
      type: "integer",
      enum: [0, 1],
      description: "Optional Rat-hour (자시) rule — 0: Ya-jasi/야자시 (default), 1: Jo-jasi/조자시.",
    },
    option2: {
      type: "integer",
      enum: [0, -1],
      description: "Optional year-pillar season basis — 0: Ipchun/입춘 (default, standard practice), -1: Dongji/동지.",
    },
    loc: {
      type: "integer",
      description: "Optional birthplace region ID for overseas births (24Plus world-city ID). Omit for Korea.",
    },
    time_unknown: {
      type: "boolean",
      description: "Optional. true if the birth time is unknown — the chart header marks the hour pillar as estimated. Pair with HHMM=1230.",
    },
  },
  required: ["birth", "gender"],
};

/**
 * Free-5 allowlist. tool name -> { preset, description }.
 * preset values MUST be 'try'+'mcp' channel free presets in the backend registry.
 * Adding a paid preset here would defeat the BM separation — do not.
 */
const TOOLS = [
  {
    name: "saju_chart",
    preset: "saju",
    description:
      "Korean Saju (Four Pillars / 四柱八字) birth chart. Returns the four pillars (year/month/day/hour), heavenly stems & earthly branches, and the Ten Gods / Spirit-Star overview. Use for 'show me my saju / birth chart'.",
  },
  {
    name: "ohaeng_balance",
    preset: "saju_ohang",
    description:
      "Five Elements (五行 / 오행: Wood·Fire·Earth·Metal·Water) distribution of the birth chart, including hidden-stem weighting. Use for 'analyze my five elements / element balance'.",
  },
  {
    name: "gyeokguk",
    preset: "gyeokguk",
    description:
      "Gyeokguk (格局, chart structure/pattern) determination with the supporting chart table. Use for 'what is my gyeokguk / chart pattern'.",
  },
  {
    name: "eumyang_johu",
    preset: "eumyang",
    description:
      "Yin-Yang (陰陽 / 음양) and Climate (調候 / 조후, hot-cold-wet-dry) balance diagnostic, including how it shifts across major/yearly fortune periods. Use for 'yin-yang / climate balance'.",
  },
  {
    name: "yongshin_candidates",
    preset: "yongshin_candidates",
    description:
      "Classical Yongshin (用神, favorable element) CANDIDATES — the 5 traditional types (Eokbu / Byeongyak / Tonggwan / Johu / Gyeokguk) and their candidate elements. This is the classical-theory view; it does NOT include an AI-selected final yongshin or confidence scores. Use for 'what are my yongshin candidates'.",
  },
];

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

const server = new Server(
  { name: "cafe-mcp", version: "0.6.2" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: BIRTH_INPUT,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const tool = TOOL_BY_NAME.get(name);

  // Allowlist enforcement — unknown / non-free tool names are rejected here.
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  }

  if (!args.birth || args.gender === undefined || args.gender === null) {
    return {
      isError: true,
      content: [
        { type: "text", text: "Required: 'birth' (YYYYMMDDHHMM) and 'gender' (0=female, 1=male)." },
      ],
    };
  }

  // preset is fixed by the tool — never taken from client input.
  // v0.6.2: forward chart options with strict coercion — only the exact enum
  // values reach the backend (option2: only -1 means Dongji; anything else → 0).
  const body = {
    preset: tool.preset,
    birth: String(args.birth),
    gender: Number(args.gender),
    name: typeof args.name === "string" ? args.name : "",
    is_lunar: Boolean(args.is_lunar),
    is_leap_year: Boolean(args.is_leap_year),
    option1: args.option1 === 1 ? 1 : 0,
    option2: args.option2 === -1 ? -1 : 0,
    time_unknown: Boolean(args.time_unknown),
    ...(Number.isInteger(args.loc) ? { loc: args.loc } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // v0.6.2: channel marker for backend usage analytics (mcp_usage_log).
        // Older backends simply ignore the header.
        "X-Channel": "mcp",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Backend error ${res.status} for tool '${name}': ${text.slice(0, 500)}` },
        ],
      };
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return { content: [{ type: "text", text }] };
    }

    // Return the extracted panels (safe data). Strip nothing else here.
    const out = {
      tool: name,
      preset_label: payload.preset_label,
      panel_count: payload.panel_count,
      panels: payload.panels,
    };
    // v0.6.2 (2026-06-11): prepend the backend-built [기본정보] text header
    // (base_info_text) so LLM clients see the chart basis (pillars,
    // calendar/season basis, gender, age, luck-cycle info, Rat-hour rule)
    // without parsing the panels JSON. Backends without the field → no header (safe).
    const headerText =
      typeof payload.base_info_text === "string" && payload.base_info_text.trim()
        ? payload.base_info_text.trim() + "\n\n"
        : "";
    return { content: [{ type: "text", text: headerText + JSON.stringify(out, null, 2) + "\n\n" + FUNNEL_NOTE }] };
  } catch (err) {
    const msg = err && err.name === "AbortError" ? `timeout after ${REQUEST_TIMEOUT_MS}ms` : String(err);
    return {
      isError: true,
      content: [{ type: "text", text: `Request failed for tool '${name}': ${msg}` }],
    };
  } finally {
    clearTimeout(timer);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is reserved for the MCP protocol stream.
  console.error(`[cafe-mcp] ready — 5 free tools, backend: ${ENDPOINT}`);
}

main().catch((e) => {
  console.error("[cafe-mcp] fatal:", e);
  process.exit(1);
});
