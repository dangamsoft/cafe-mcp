// English summaries from real engine panels (1990-01-15 10:30, male, Seoul; fixture captured 2026-09-27).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarize, chartFacts, structureRationale } from "../summary.js";
import { toDay } from "../server.js";

const P = JSON.parse(readFileSync(new URL("./fixtures/panels_19900115_1030_m.json", import.meta.url), "utf8"));

test("saju_chart: pillars, Day Master, both element bases", () => {
  const { summary_en, highlights } = summarize("saju_chart", P.saju);
  assert.match(summary_en, /辛巳 庚辰 丁丑 己巳/);
  assert.equal(highlights.day_master.en, "Yang Metal");
  assert.equal(highlights.pillars.month.stem_ten_god, "Direct Officer");
  assert.ok(highlights.five_elements.weighted && highlights.five_elements.surface);
  assert.notDeepEqual(highlights.five_elements.weighted, highlights.five_elements.surface);
  assert.ok(!/[가-힣]/.test(summary_en), "summary is English");
});

test("gyeokguk: rationale from the engine's structure position", () => {
  const facts = chartFacts(P.saju);
  assert.equal(facts.structure.position, "cc_ss");
  const why = structureRationale(facts);
  assert.match(why, /hour stem 辛 \(Rob Wealth\)/);
  assert.doesNotMatch(why, /then the hour stem/);
  assert.match(why, /month branch 丑/);
  assert.match(why, /Yang Blade/);
  const { summary_en, highlights } = summarize("gyeokguk", P.gyeokguk, { sajuPanels: P.saju });
  assert.equal(highlights.structure.name_en, "Yang Blade (Kui Gang)");
  assert.equal(highlights.element_distribution.basis, "surface, eight characters only");
  assert.match(summary_en, /Why: /);
});

test("ohaeng_balance, eumyang_johu, yongshin_candidates summaries", () => {
  const o = summarize("ohaeng_balance", P.saju_ohang);
  assert.equal(o.highlights.five_elements.basis, "weighted, hidden stems included");
  const e = summarize("eumyang_johu", P.eumyang);
  assert.equal(e.highlights.natal.yin_yang, "balanced yin and yang");
  const y = summarize("yongshin_candidates", P.yongshin_candidates);
  assert.equal(Object.keys(y.highlights.agreement)[0], "Fire");
  for (const r of [o, e, y]) assert.ok(!/[가-힣]/.test(r.summary_en), "summary is English");
});

test("manse_calendar: pillars_change carries the earlier pillars", () => {
  const prev = { "날짜키": "2027-02-03", "육십갑자": "계축", "육십갑자한자": "癸丑", "월주": "신축", "년주": "병오" };
  const day = toDay({ "날짜키": "2027-02-04", "육십갑자": "갑인", "육십갑자한자": "甲寅", "월주": "임인", "년주": "정미", "절기": "입춘", "절기시간": "2027-02-04 10:46" }, prev);
  assert.deepEqual(day.pillars_change.before, { month_pillar: { ko: "신축", hanja: "辛丑" }, year_pillar: { ko: "병오", hanja: "丙午" } });
  const mid = toDay({ "날짜키": "2027-02-19", "육십갑자": "기사", "육십갑자한자": "己巳", "월주": "임인", "년주": "정미", "절기": "우수", "절기시간": "2027-02-19 06:33" }, prev);
  assert.equal(mid.pillars_change, undefined, "mid-month terms (中氣) do not change pillars");
});
