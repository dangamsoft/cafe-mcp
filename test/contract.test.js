import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, normalizeBirth, toBackendBody, parseCalendarArgs, FREE_TOOLS } from "../server.js";

const PANEL_OK = { preset_label: "사주 원국", panel_count: 1, panels: [{ key: "saju_table", data: { day: "乙巳" } }], base_info_text: "[기본정보] 을사 일주" };

async function connect(fetchImpl) {
  const server = createServer({ fetchImpl, apiBase: "https://example.test/api" });
  const client = new Client({ name: "test", version: "0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}
const errOf = (r) => JSON.parse(r.content[1].text).error;
const okFetch = (calls = []) => async (url, init) => {
  calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
  return new Response(JSON.stringify(PANEL_OK), { status: 200 });
};

test("birth parsing: ISO, legacy, invalid", () => {
  assert.equal(normalizeBirth("1974-12-30T05:30"), "197412300530");
  assert.equal(normalizeBirth("197412300530"), "197412300530");
  assert.equal(normalizeBirth("2026-02-30T10:00"), null);
  assert.equal(normalizeBirth("1899-01-01T00:00"), null);
  assert.equal(normalizeBirth("19741230"), null);
});

test("legacy v0.6 arguments map to the same backend body as the new names", () => {
  const a = toBackendBody({ birth: "197412300530", gender: 1, option1: 1, option2: -1, is_lunar: true, is_leap_year: true }, "saju").body;
  const b = toBackendBody({ birth: "1974-12-30T05:30", sex: "male", rat_hour_rule: "early", year_boundary: "winter_solstice", calendar: "lunar", lunar_leap_month: true }, "saju").body;
  assert.deepEqual(a, b);
});

test("tool list: five chart tools + manse_calendar, read-only, with output schema", async () => {
  const client = await connect(okFetch());
  const { tools } = await client.listTools();
  // errors must pass client-side output validation (validators are cached after listTools)
  const bad = await client.callTool({ name: "saju_chart", arguments: { birth: "2026-02-30T10:00", sex: "male" } });
  assert.equal(bad.isError, true);
  assert.equal(bad.structuredContent, undefined);
  assert.deepEqual(tools.map((t) => t.name).sort(), [...FREE_TOOLS.map((t) => t.name), "manse_calendar"].sort());
  for (const t of tools) {
    assert.equal(t.annotations.readOnlyHint, true);
    assert.ok(t.outputSchema, `${t.name} has outputSchema`);
    assert.ok(!("preset" in t.inputSchema.properties), "no generic preset input");
  }
});

test("each tool sends its fixed preset and returns structuredContent", async () => {
  const calls = [];
  const client = await connect(okFetch(calls));
  for (const t of FREE_TOOLS) {
    const r = await client.callTool({ name: t.name, arguments: { birth: "1974-12-30T05:30", sex: "male" } });
    assert.ok(!r.isError, t.name);
    assert.equal(r.structuredContent.tool, t.name);
    assert.equal(r.structuredContent.engine, "cafe");
    assert.deepEqual(r.structuredContent.data.panels, PANEL_OK.panels);
  }
  assert.deepEqual(calls.map((c) => c.body.preset), FREE_TOOLS.map((t) => t.preset));
  assert.equal(calls[0].headers["X-Channel"], "mcp");
});

test("errors are stable codes; backend body is never forwarded", async () => {
  const secret = "Traceback: db password=hunter2";
  const client = await connect(async () => new Response(secret, { status: 500 }));
  const r = await client.callTool({ name: "saju_chart", arguments: { birth: "1974-12-30T05:30", sex: "male" } });
  assert.equal(r.isError, true);
  assert.equal(errOf(r).code, "backend_unavailable");
  assert.ok(!JSON.stringify(r).includes("hunter2"));

  const bad = await client.callTool({ name: "saju_chart", arguments: { birth: "2026-02-30T10:00", sex: "male" } });
  assert.equal(errOf(bad).code, "invalid_input");
  assert.equal(errOf(bad).field, "birth");

  const tz = await client.callTool({ name: "saju_chart", arguments: { birth: "1990-01-15T10:30", sex: "female", timezone: "America/New_York" } });
  assert.equal(errOf(tz).field, "timezone");
});

test("rate limit maps to rate_limited", async () => {
  const client = await connect(async () => new Response("slow down", { status: 429, headers: { "retry-after": "30" } }));
  const r = await client.callTool({ name: "gyeokguk", arguments: { birth: "1974-12-30T05:30", sex: "male" } });
  assert.equal(errOf(r).code, "rate_limited");
  assert.equal(errOf(r).retry_after_s, 30);
});

test("ontology resource and full_reading prompt are exposed", async () => {
  const client = await connect(okFetch());
  const { resources } = await client.listResources();
  assert.ok(resources.some((r) => r.uri === "cafe://ontology"));
  const res = await client.readResource({ uri: "cafe://ontology" });
  assert.ok(res.contents[0].text.includes("@prefix"));
  const p = await client.getPrompt({ name: "full_reading", arguments: { birth: "1974-12-30T05:30", sex: "male", language: "en" } });
  assert.match(p.messages[0].content.text, /saju_chart/);
});

const CAL_ROWS = [
  { "날짜키": "2027-02-03", "음력날짜": "2026-12-27", "육십갑자": "계축", "육십갑자한자": "癸丑", "손없는날": false, "공망일": true, "황도일": false, "설명": [{ "키": "12신살", "내용": "x" }] },
  { "날짜키": "2027-02-04", "음력날짜": "2026-12-28", "육십갑자": "갑인", "육십갑자한자": "甲寅", "월주": "임인", "년주": "정미", "손없는날": true, "공망일": false, "황도일": true, "절기": "입춘", "절기시간": "2027-02-04 10:46", "설명": [] },
];
const calFetch = (calls = []) => async (url, init) => {
  calls.push(JSON.parse(init.body));
  return new Response(JSON.stringify({ preset_label: "만세력 달력", panel_count: 2, panels: [{ kind: "ctrl_hz", data: {} }, { kind: "fort_calendar", data: { "캘린더": CAL_ROWS } }] }), { status: 200 });
};

test("manse_calendar: month/date parsing", () => {
  assert.deepEqual(parseCalendarArgs({ month: "2027-02" }), { month: "2027-02" });
  assert.deepEqual(parseCalendarArgs({ date: "2027-02-04" }), { month: "2027-02", date: "2027-02-04" });
  assert.equal(parseCalendarArgs({ month: "2027-13" }).error.code, "invalid_input");
  assert.equal(parseCalendarArgs({ date: "2027-02-30" }).error.field, "date");
  assert.deepEqual(parseCalendarArgs({}, new Date("2026-09-30T20:00:00Z")), { month: "2026-10" }); // KST rollover
});

test("manse_calendar: fixed calendar preset, public fields only", async () => {
  const calls = [];
  const client = await connect(calFetch(calls));
  const r = await client.callTool({ name: "manse_calendar", arguments: { date: "2027-02-04" } });
  assert.ok(!r.isError);
  assert.equal(calls[0].preset, "calendar");
  assert.equal(calls[0].xl_value, "202702");
  assert.deepEqual(r.structuredContent.days, [{
    date: "2027-02-04", weekday: "Thu", lunar_date: "2026-12-28", day_pillar: { ko: "갑인", hanja: "甲寅" },
    month_pillar: { ko: "임인", hanja: "壬寅" }, year_pillar: { ko: "정미", hanja: "丁未" },
    son_eomneun_nal: true, hwangdo_il: true, solar_term: { name: "입춘", time: "2027-02-04 10:46" },
  }]);
  const all = await client.callTool({ name: "manse_calendar", arguments: { month: "2027-02" } });
  assert.equal(all.structuredContent.days.length, 2);
  assert.ok(!JSON.stringify(all.structuredContent).includes("공망"), "chart-relative fields dropped");
});
