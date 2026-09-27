/**
 * @dangamsoft/cafe-mcp — server factory (contract 1.0).
 *
 * Korean Saju / BaZi (Four Pillars) MCP server. Free calculation tools forward to the
 * 24Plus backend `POST /try/panels`, which returns extracted (safe) panels only.
 *
 * Invariants (do not weaken):
 *   1. Tool -> preset allowlist is hard-coded. No generic "preset" input exists,
 *      so a client can never reach a paid preset through the free tools.
 *   2. No API key, engine or database is bundled. Only HTTPS calls to the public backend.
 *   3. Backend error bodies are never forwarded to the client (stable error codes only).
 *   4. Birth inputs are sent to the backend for the calculation and are not stored here.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));
export const CONTRACT = "1.0";

const DEFAULT_API = "https://24plus.ai.kr/api";
const REQUEST_TIMEOUT_MS = 15000;

/* ── input ─────────────────────────────────────────────────────────────── */

/** Parse ISO `YYYY-MM-DDTHH:mm` or legacy `YYYYMMDDHHmm` → 12-digit string, or null if invalid. */
export function normalizeBirth(raw) {
  const s = String(raw ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/) || s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (y < 1900 || y > 2100 || h > 23 || mi > 59) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return m.slice(1).join("");
}

const KOREA_TZ = new Set(["Asia/Seoul", "ROK"]);

export const BIRTH_INPUT = {
  birth: z.string().describe("Local birth date and time. ISO 8601 'YYYY-MM-DDTHH:mm' (e.g. 1990-01-15T10:30) or legacy 12 digits 'YYYYMMDDHHmm'. Use 12:30 when the time is unknown and set time_unknown."),
  sex: z.enum(["female", "male"]).optional().describe("Sex at birth; sets the direction of the 10-year luck cycles. Required unless legacy 'gender' is given."),
  gender: z.union([z.literal(0), z.literal(1)]).optional().describe("Legacy form of sex: 0 female, 1 male."),
  calendar: z.enum(["solar", "lunar"]).optional().describe("Calendar of the birth date. Default solar."),
  lunar_leap_month: z.boolean().optional().describe("Lunar leap month (윤달). Only with calendar=lunar."),
  timezone: z.string().optional().describe("IANA time zone of the birthplace. Asia/Seoul is supported directly; for births elsewhere pass 'loc'."),
  loc: z.number().int().optional().describe("24Plus world-city ID for births outside Korea."),
  time_unknown: z.boolean().optional().describe("Birth time unknown; the hour pillar is marked as estimated."),
  rat_hour_rule: z.enum(["late", "early"]).optional().describe("Rat-hour (子時) rule: 'late' 야자시 (default) or 'early' 조자시."),
  year_boundary: z.enum(["lichun", "winter_solstice"]).optional().describe("Year pillar boundary: 'lichun' 입춘 (default) or 'winter_solstice' 동지."),
  name: z.string().max(40).optional().describe("Optional display name."),
  // legacy aliases (v0.6)
  is_lunar: z.boolean().optional().describe("Legacy form of calendar=lunar."),
  is_leap_year: z.boolean().optional().describe("Legacy form of lunar_leap_month."),
  option1: z.union([z.literal(0), z.literal(1)]).optional().describe("Legacy form of rat_hour_rule (1 = early)."),
  option2: z.union([z.literal(0), z.literal(-1)]).optional().describe("Legacy form of year_boundary (-1 = winter_solstice)."),
};

/** Tool arguments → backend body, or { error } with a stable code. */
export function toBackendBody(args, preset) {
  const birth = normalizeBirth(args.birth);
  if (!birth) return { error: invalid("birth", "Use a real date between 1900 and 2100 as YYYY-MM-DDTHH:mm or YYYYMMDDHHmm.") };
  let gender;
  if (args.sex) gender = args.sex === "male" ? 1 : 0;
  else if (args.gender === 0 || args.gender === 1) gender = args.gender;
  else return { error: invalid("sex", "Required: 'female' or 'male'.") };
  if (args.timezone && !KOREA_TZ.has(args.timezone) && !Number.isInteger(args.loc)) {
    return { error: invalid("timezone", "Births outside Korea need 'loc' (24Plus world-city ID). Other IANA time zones are not accepted yet, to avoid a silently wrong chart.") };
  }
  const lunar = args.calendar ? args.calendar === "lunar" : Boolean(args.is_lunar);
  return {
    body: {
      preset,
      birth,
      gender,
      name: typeof args.name === "string" ? args.name : "",
      is_lunar: lunar,
      is_leap_year: lunar && Boolean(args.lunar_leap_month ?? args.is_leap_year),
      option1: args.rat_hour_rule ? (args.rat_hour_rule === "early" ? 1 : 0) : (args.option1 === 1 ? 1 : 0),
      option2: args.year_boundary ? (args.year_boundary === "winter_solstice" ? -1 : 0) : (args.option2 === -1 ? -1 : 0),
      time_unknown: Boolean(args.time_unknown),
      ...(Number.isInteger(args.loc) ? { loc: args.loc } : {}),
    },
    echo: {
      birth, calendar: lunar ? "lunar" : "solar", sex: gender === 1 ? "male" : "female",
      timezone: Number.isInteger(args.loc) ? `loc:${args.loc}` : "Asia/Seoul",
    },
  };
}

function invalid(field, reason) {
  return { code: "invalid_input", field, message: reason };
}

/* ── output ────────────────────────────────────────────────────────────── */

export const OUTPUT_SHAPE = {
  engine: z.literal("cafe"),
  contract: z.string(),
  tool: z.string(),
  input_echo: z.object({ birth: z.string(), calendar: z.string(), sex: z.string(), timezone: z.string() }),
  basis: z.string().optional().describe("Chart basis text ([기본정보]): pillars, calendar/season basis, luck-cycle start."),
  data: z.object({ label: z.string().optional(), panel_count: z.number().optional(), panels: z.any() }),
  links: z.object({ web: z.string() }),
  disclaimer: z.string(),
};

const DISCLAIMER = "For cultural and entertainment purposes; not medical, legal or financial advice.";
const WEB = "https://24plus.ai.kr";

// Errors carry no structuredContent: clients validate structuredContent against the tool's
// outputSchema even on isError. The stable error object is the second text block (JSON).
function errorResult(err) {
  return {
    isError: true,
    content: [
      { type: "text", text: `${err.code}${err.field ? ` (${err.field})` : ""}: ${err.message}` },
      { type: "text", text: JSON.stringify({ error: err }) },
    ],
  };
}

/** POST /try/panels → { payload } or { error } with a stable code. Backend bodies are never forwarded. */
async function postPanels(fetchImpl, endpoint, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res, text;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Channel": "mcp", "User-Agent": `cafe-mcp/${PKG.version}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    text = await res.text();
  } catch (e) {
    const timeout = e && e.name === "AbortError";
    return { error: { code: timeout ? "timeout" : "backend_unavailable", message: timeout ? `No response within ${REQUEST_TIMEOUT_MS / 1000}s. Try again.` : "The engine could not be reached. Try again shortly." } };
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) return { error: { code: "rate_limited", message: "Free tier limit reached. Try again later.", retry_after_s: Number(res.headers.get("retry-after")) || 60 } };
  if (res.status === 400 || res.status === 422) return { error: invalid("input", "The engine rejected this input.") };
  if (!res.ok) return { error: { code: "backend_unavailable", message: `Engine error (${res.status}). Try again shortly.` } };
  try { return { payload: JSON.parse(text) }; } catch { return { error: { code: "backend_unavailable", message: "Unexpected engine response." } }; }
}

/* ── manse_calendar (date-based, no birth input) ───────────────────────── */

export const CALENDAR_INPUT = {
  month: z.string().optional().describe("Month to list, 'YYYY-MM' (1900-01 to 2100-12). Default: the current month in Korea (Asia/Seoul)."),
  date: z.string().optional().describe("A single day 'YYYY-MM-DD'. When given, only that day is returned and 'month' is ignored."),
};

const DAY_SHAPE = z.object({
  date: z.string(),
  weekday: z.string(),
  lunar_date: z.string().optional(),
  day_pillar: z.object({ ko: z.string(), hanja: z.string() }),
  month_pillar: z.object({ ko: z.string(), hanja: z.string() }).optional().describe("Month pillar of that day; changes on the solar-term (節) day."),
  year_pillar: z.object({ ko: z.string(), hanja: z.string() }).optional().describe("Year pillar of that day; changes at 입춘 (Lichun)."),
  solar_term: z.object({ name: z.string(), time: z.string().optional().describe("Exact start, 'YYYY-MM-DD HH:mm' in Korea time (UTC+9).") }).optional(),
  holiday: z.string().optional(),
  son_eomneun_nal: z.boolean().describe("손없는날: traditional day free of wandering spirits, used for moving house."),
  hwangdo_il: z.boolean().describe("황도일: traditionally auspicious day."),
});

export const CALENDAR_OUTPUT = {
  engine: z.literal("cafe"),
  contract: z.string(),
  tool: z.literal("manse_calendar"),
  month: z.string(),
  days: z.array(DAY_SHAPE),
  links: z.object({ web: z.string() }),
  disclaimer: z.string(),
};

const CC_HANJA = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
const GG_HANJA = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };
function pillar(ko) {
  const k = String(ko || "").trim();
  if (k.length !== 2 || !CC_HANJA[k[0]] || !GG_HANJA[k[1]]) return undefined;
  return { ko: k, hanja: CC_HANJA[k[0]] + GG_HANJA[k[1]] };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Fixed reference chart: the calendar grid is date-based, the backend only needs a valid chart to run.
// Chart-relative fields (공망일, personal day ratings) are dropped below.
const CALENDAR_REF_BIRTH = "200001011200";

/** { month:'YYYY-MM', date?:'YYYY-MM-DD' } or { error } */
export function parseCalendarArgs(args, now = new Date()) {
  if (args.date) {
    const m = String(args.date).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const ok = m && normalizeBirth(`${m[1]}${m[2]}${m[3]}1200`);
    if (!ok) return { error: invalid("date", "Use a real date 'YYYY-MM-DD' between 1900 and 2100.") };
    return { month: `${m[1]}-${m[2]}`, date: `${m[1]}-${m[2]}-${m[3]}` };
  }
  if (args.month) {
    const m = String(args.month).trim().match(/^(\d{4})-(\d{2})$/);
    if (!m || +m[1] < 1900 || +m[1] > 2100 || +m[2] < 1 || +m[2] > 12) return { error: invalid("month", "Use 'YYYY-MM' between 1900-01 and 2100-12.") };
    return { month: `${m[1]}-${m[2]}` };
  }
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return { month: `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}` };
}

/** backend fort_calendar row → public day object (drops chart-relative fields) */
export function toDay(row) {
  const key = String(row["날짜키"] || "");
  const [y, mo, d] = key.split("-").map(Number);
  const day = {
    date: key,
    weekday: WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()] || "",
    day_pillar: { ko: String(row["육십갑자"] || ""), hanja: String(row["육십갑자한자"] || "") },
    son_eomneun_nal: Boolean(row["손없는날"]),
    hwangdo_il: Boolean(row["황도일"]),
  };
  const mp = pillar(row["월주"]);
  const yp = pillar(row["년주"]);
  if (mp) day.month_pillar = mp;
  if (yp) day.year_pillar = yp;
  if (row["음력날짜"]) day.lunar_date = String(row["음력날짜"]);
  if (row["절기"]) day.solar_term = { name: String(row["절기"]), ...(row["절기시간"] ? { time: String(row["절기시간"]) } : {}) };
  if (row["공휴일"]) day.holiday = String(row["공휴일"]);
  return day;
}

/* ── tools ─────────────────────────────────────────────────────────────── */

/** Free allowlist. tool -> backend preset. Do not add paid presets here. */
export const FREE_TOOLS = [
  { name: "saju_chart", preset: "saju", title: "Saju / BaZi natal chart",
    description: "Four Pillars (四柱八字) natal chart: year/month/day/hour stems and branches, Ten Gods (十神), hidden stems, five-element ratios, Spirit Stars (神殺) and Twelve Life Stages (十二運星) per pillar. The foundation other tools build on. Use for 'show my saju / bazi chart', '내 사주 봐줘'." },
  { name: "ohaeng_balance", preset: "saju_ohang", title: "Five Elements balance",
    description: "Five Elements (五行: Wood, Fire, Earth, Metal, Water) distribution with hidden-stem weighting; dominant and weakest element. Use for 'which element am I missing', '오행 분석'." },
  { name: "gyeokguk", preset: "gyeokguk", title: "Chart structure (格局)",
    description: "Gyeokguk (格局) chart structure by classical rules: named pattern and grade, body strength (strong/weak), sub-patterns, and the elements behind the judgment. Use for 'what is my chart pattern', '내 격국'." },
  { name: "eumyang_johu", preset: "eumyang", title: "Yin-Yang and climate balance",
    description: "Yin-Yang (陰陽) ratio and climate (調候: hot/cold, dry/wet) balance, and how they shift across 10-year and yearly luck cycles. Use for 'is my chart hot or cold', '조후 분석'." },
  { name: "yongshin_candidates", preset: "yongshin_candidates", title: "Favorable element candidates",
    description: "Classical Yongshin (用神, favorable element) candidates from five methods (Eokbu, Byeongyak, Tonggwan, Johu, Gyeokguk) with each method's pick. No final engine decision. Use for 'my favorable element candidates', '용신 후보'." },
];

export function createServer({ fetchImpl = globalThis.fetch, apiBase = process.env.CAFE_MCP_API_URL || DEFAULT_API } = {}) {
  const endpoint = `${apiBase.replace(/\/+$/, "")}/try/panels`;
  const server = new McpServer({ name: "cafe-mcp", version: PKG.version });

  for (const t of FREE_TOOLS) {
    server.registerTool(
      t.name,
      {
        title: t.title,
        description: t.description,
        inputSchema: BIRTH_INPUT,
        outputSchema: OUTPUT_SHAPE,
        annotations: { readOnlyHint: true, openWorldHint: true, idempotentHint: true },
      },
      async (args) => {
        const mapped = toBackendBody(args, t.preset);
        if (mapped.error) return errorResult(mapped.error);

        const got = await postPanels(fetchImpl, endpoint, mapped.body);
        if (got.error) return errorResult(got.error);
        const payload = got.payload;

        const basis = typeof payload.base_info_text === "string" ? payload.base_info_text.trim() : "";
        const structured = {
          engine: "cafe",
          contract: CONTRACT,
          tool: t.name,
          input_echo: mapped.echo,
          ...(basis ? { basis } : {}),
          data: { label: payload.preset_label, panel_count: payload.panel_count, panels: payload.panels },
          links: { web: `${WEB}/manse` },
          disclaimer: DISCLAIMER,
        };
        const summary = [
          basis || `${t.title} for ${mapped.echo.birth} (${mapped.echo.calendar}, ${mapped.echo.sex})`,
          "",
          "Structured result is in structuredContent.data.panels.",
          `Full readings (final favorable element, reports): ${WEB}`,
        ].join("\n");
        return {
          content: [{ type: "text", text: summary }, { type: "text", text: JSON.stringify(structured.data) }],
          structuredContent: structured,
        };
      },
    );
  }

  server.registerTool(
    "manse_calendar",
    {
      title: "Manse-ryeok calendar (day pillars)",
      description: "Korean manse-ryeok (萬歲曆) calendar for a month or a single day: each day's pillar (日辰), month and year pillars, lunar date, solar term (節氣) with its exact start time (Korea time) when one falls on that day, 손없는날 and 황도일 flags. No birth data needed. Use for 'what is today's day pillar', '이번 달 손없는날', '2027년 2월 일진'.",
      inputSchema: CALENDAR_INPUT,
      outputSchema: CALENDAR_OUTPUT,
      annotations: { readOnlyHint: true, openWorldHint: true, idempotentHint: true },
    },
    async (args) => {
      const q = parseCalendarArgs(args);
      if (q.error) return errorResult(q.error);
      const got = await postPanels(fetchImpl, endpoint, {
        preset: "calendar", birth: CALENDAR_REF_BIRTH, gender: 1, xl_value: q.month.replace("-", ""),
      });
      if (got.error) return errorResult(got.error);
      const panel = (got.payload.panels || []).find((p) => p && p.kind === "fort_calendar");
      const rows = panel && panel.data && Array.isArray(panel.data["캘린더"]) ? panel.data["캘린더"] : [];
      let days = rows.map(toDay).filter((d) => d.date.startsWith(q.month));
      if (q.date) days = days.filter((d) => d.date === q.date);
      if (!days.length) return errorResult({ code: "backend_unavailable", message: `No calendar data for ${q.date || q.month}. Try again shortly.` });
      const structured = {
        engine: "cafe", contract: CONTRACT, tool: "manse_calendar", month: q.month, days,
        links: { web: `${WEB}/manse` }, disclaimer: DISCLAIMER,
      };
      const head = q.date
        ? `${q.date} (${days[0].weekday}): day pillar ${days[0].day_pillar.ko} ${days[0].day_pillar.hanja}`
        : `${q.month}: ${days.length} days, ${days[0].date} ${days[0].day_pillar.ko} to ${days[days.length - 1].date} ${days[days.length - 1].day_pillar.ko}`;
      return {
        content: [{ type: "text", text: `${head}\nStructured result is in structuredContent.days.` }, { type: "text", text: JSON.stringify(days) }],
        structuredContent: structured,
      };
    },
  );

  /* resources: the public ontology (CC BY 4.0) */
  const ttlPath = join(HERE, "ontology", "cafe-ontology.ttl");
  server.registerResource(
    "cafe-ontology",
    "cafe://ontology",
    { title: "CAFE Saju ontology (OWL 2, Turtle)", description: "Public W3C OWL 2 ontology for Korean Saju / BaZi: stems, branches, elements, ten gods, patterns. CC BY 4.0.", mimeType: "text/turtle" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/turtle", text: readFileSync(ttlPath, "utf8") }] }),
  );

  /* prompt: full reading using the free tools */
  server.registerPrompt(
    "full_reading",
    {
      title: "Full Saju / BaZi reading",
      description: "Call the free cafe-mcp tools in order and write a reading in the user's language.",
      argsSchema: { birth: z.string().describe("YYYY-MM-DDTHH:mm"), sex: z.string().describe("female or male"), language: z.string().optional().describe("Reading language, e.g. en, ko, ja, zh") },
    },
    ({ birth, sex, language }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Give me a Saju (BaZi, Four Pillars) reading for birth ${birth}, sex ${sex}.
Call saju_chart, ohaeng_balance, gyeokguk, eumyang_johu and yongshin_candidates from cafe-mcp with these inputs.
Base every statement on the returned data; do not invent pillars or elements.
Write the reading in ${language || "the language I am using"}: chart overview, element balance, structure, climate, favorable element candidates, then 3 practical suggestions.
End with one line: "${DISCLAIMER}"`,
        },
      }],
    }),
  );

  return server;
}
