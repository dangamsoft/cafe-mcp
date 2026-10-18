/**
 * English summaries and highlights for tool results (1.0.3).
 * The backend returns Korean panel data; this module only picks fields and translates labels.
 * Nothing here computes Saju: every value comes from the engine panels. Contract stays 1.0 (additive).
 */

const STEM = {
  甲: ["Jia", "Yang Wood"], 乙: ["Yi", "Yin Wood"], 丙: ["Bing", "Yang Fire"], 丁: ["Ding", "Yin Fire"], 戊: ["Wu", "Yang Earth"],
  己: ["Ji", "Yin Earth"], 庚: ["Geng", "Yang Metal"], 辛: ["Xin", "Yin Metal"], 壬: ["Ren", "Yang Water"], 癸: ["Gui", "Yin Water"],
};
const EL = { 목: "Wood", 화: "Fire", 토: "Earth", 금: "Metal", 수: "Water", 木: "Wood", 火: "Fire", 土: "Earth", 金: "Metal", 水: "Water" };
const EL_ORDER = ["목", "화", "토", "금", "수"];
export const TEN_GOD = {
  비견: "Friend", 겁재: "Rob Wealth", 식신: "Eating God", 상관: "Hurting Officer", 편재: "Indirect Wealth", 정재: "Direct Wealth",
  편관: "Seven Killings", 정관: "Direct Officer", 편인: "Indirect Resource", 정인: "Direct Resource",
};
const STAGE = { 장생: "Birth", 목욕: "Bath", 관대: "Dress", 건록: "Prosperity", 제왕: "Peak", 쇠: "Decline", 병: "Sickness", 사: "Death", 묘: "Tomb", 절: "Void", 태: "Conception", 양: "Nurture" };
const GYEOK = {
  정관격: "Direct Officer", 편관격: "Seven Killings", 칠살격: "Seven Killings", 정재격: "Direct Wealth", 편재격: "Indirect Wealth",
  식신격: "Eating God", 상관격: "Hurting Officer", 정인격: "Direct Resource", 편인격: "Indirect Resource", 건록격: "Prosperity (Jian Lu)",
  양인격: "Yang Blade", 비겁격: "Rob Wealth", 괴강격: "Kui Gang", 종왕격: "Follow the Strong", 종강격: "Follow the Strong",
  종재격: "Follow Wealth", 종살격: "Follow Officer", 종관격: "Follow Officer", 종아격: "Follow Output",
};
const POS = { ss: "hour", dd: "day", mm: "month", yy: "year" };
const PILLAR_KO = { 시주: "hour", 일주: "day", 월주: "month", 년주: "year" };
const STATE = {
  음양균형: "balanced yin and yang", 음실양허: "yin strong, yang weak", 양실음허: "yang strong, yin weak",
  조후균형: "balanced climate", 한습: "cold and damp", 조열: "hot and dry", 한조: "cold and dry", 난습: "warm and damp",
  한냉: "cold", 온난: "warm", 조습균형: "balanced moisture",
};
const METHOD = { 억부: "Balance (抑扶)", 병약: "Remedy (病藥)", 통관: "Mediator (通關)", 조후: "Climate (調候)", 격국: "Structure (格局)" };
export const SOLAR_TERM = {
  입춘: "Lichun (Start of Spring)", 우수: "Yushui (Rain Water)", 경칩: "Jingzhe (Awakening of Insects)", 춘분: "Chunfen (Spring Equinox)",
  청명: "Qingming (Pure Brightness)", 곡우: "Guyu (Grain Rain)", 입하: "Lixia (Start of Summer)", 소만: "Xiaoman (Grain Buds)",
  망종: "Mangzhong (Grain in Ear)", 하지: "Xiazhi (Summer Solstice)", 소서: "Xiaoshu (Minor Heat)", 대서: "Dashu (Major Heat)",
  입추: "Liqiu (Start of Autumn)", 처서: "Chushu (End of Heat)", 백로: "Bailu (White Dew)", 추분: "Qiufen (Autumn Equinox)",
  한로: "Hanlu (Cold Dew)", 상강: "Shuangjiang (Frost Descent)", 입동: "Lidong (Start of Winter)", 소설: "Xiaoxue (Minor Snow)",
  대설: "Daxue (Major Snow)", 동지: "Dongzhi (Winter Solstice)", 소한: "Xiaohan (Minor Cold)", 대한: "Dahan (Major Cold)",
};
/** The 12 節 terms: the month pillar changes at their exact time (and the year pillar at 입춘). */
export const MONTH_START_TERMS = new Set(["입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설", "소한"]);

const round1 = (n) => Math.round(Number(n) * 10) / 10;
const find = (panels, kind) => (Array.isArray(panels) ? panels.find((p) => p && p.kind === kind) : undefined)?.data;
export const gyeokEn = (name) => {
  if (!name) return "";
  const m = String(name).match(/^([^(]+)(?:\(([^)]+)\))?$/);
  const main = GYEOK[m?.[1]] || m?.[1] || name;
  return m?.[2] ? `${main} (${GYEOK[m[2]] || m[2]})` : main;
};
const hz = (x) => (x && typeof x === "object" ? x["한자"] || "" : "");

function ratios(obj) {
  if (!obj || typeof obj !== "object") return undefined;
  const out = {};
  for (const k of EL_ORDER) if (obj[k] !== undefined) out[EL[k]] = round1(obj[k]);
  return Object.keys(out).length ? out : undefined;
}
const top = (r, dir) => (r ? Object.entries(r).sort((a, b) => (dir > 0 ? b[1] - a[1] : a[1] - b[1]))[0]?.[0] : undefined);

/** Facts from the saju preset's saju_table + saju_star. */
export function chartFacts(panels) {
  const t = find(panels, "saju_table");
  const star = find(panels, "saju_star");
  if (!t || !Array.isArray(t.pillars)) return undefined;
  const pillars = {};
  for (const p of t.pillars) {
    const key = PILLAR_KO[p.label];
    if (!key) continue;
    pillars[key] = {
      pillar: hz(p["천간"]) + hz(p["지지"]),
      stem_ten_god: key === "day" ? "Day Master" : TEN_GOD[p["천간"]?.["십성"]] || undefined,
      branch_ten_god: TEN_GOD[p["지지"]?.["십성"]] || undefined,
      life_stage: STAGE[String(p["십이운성"] || "").replace(/지$/, "")] || STAGE[p["십이운성"]] || undefined,
    };
  }
  const dm = pillars.day?.pillar?.[0];
  const cur = t.currentDaewoon ? hz(t.currentDaewoon["천간"]) + hz(t.currentDaewoon["지지"]) : undefined;
  const yearNow = t.currentSewoon ? hz(t.currentSewoon["천간"]) + hz(t.currentSewoon["지지"]) : undefined;
  return {
    pillars,
    day_master: dm ? { hanja: dm, pinyin: STEM[dm]?.[0], en: STEM[dm]?.[1] } : undefined,
    structure: t["격국"] ? { name_ko: t["격국"], name_en: gyeokEn(t["격국"]), position: t["격국위치"] || undefined } : undefined,
    luck_cycle: { start_age: t["대운"]?.["대운수"], current: cur || undefined },
    year_pillar_now: yearNow || undefined,
    five_elements: star ? {
      weighted: ratios(star.jijangRatios || star.cafeRatios?.jijang?.wk),
      surface: ratios(star.baseRatios || star.elementRatios),
      note: "weighted = stems, branches and hidden stems, seasonally weighted (same basis as ohaeng_balance); surface = the eight visible characters only.",
    } : undefined,
  };
}

/** Why the engine chose this structure, from 격국위치 and the pillars (engine rule, not reinterpreted). */
export function structureRationale(facts, rawTable) {
  const s = facts?.structure;
  if (!s) return undefined;
  const [layer, pos] = String(s.position || "").split("_");
  const posName = POS[pos];
  const monthBranch = facts.pillars.month?.pillar?.[1];
  const src = posName ? facts.pillars[posName] : undefined;
  let text;
  if (layer === "cc" && src) {
    const stem = src.pillar[0];
    const god = posName === "day" ? "Day Master" : src.stem_ten_god;
    text = `The engine took the structure from the ${posName} stem ${stem} (${god}), judged against the month branch ${monthBranch} `
      + "(its hidden stems, combinations and seasonal strength).";
  } else if (layer === "gg") {
    text = `The engine took the structure from the month branch ${monthBranch} itself.`;
  }
  if (!text) return undefined;
  const base = String(s.name_ko).replace(/\(.*\)$/, "");
  if (base === "양인격") text += " A Rob Wealth structure on a Yang Day Master is called Yang Blade (羊刃格).";
  if (base === "건록격") text += " A Friend (same-element) structure is called Prosperity (建祿格).";
  if (/괴강/.test(s.name_ko)) text += " The day pillar is one of the Kui Gang pillars (魁罡), noted alongside the structure.";
  return text;
}

const fmtRatios = (r) => (r ? Object.entries(r).map(([k, v]) => `${k} ${v}`).join(", ") : "");

/** Per-tool English summary + highlights. `extra` may carry panels from the saju preset. */
export function summarize(tool, panels, extra = {}) {
  const facts = chartFacts(panels) || chartFacts(extra.sajuPanels);
  const lines = [];
  const hl = {};
  const head = () => {
    if (!facts) return;
    const p = facts.pillars;
    const four = ["hour", "day", "month", "year"].map((k) => p[k]?.pillar || "").join(" ");
    const dm = facts.day_master;
    lines.push(`Four Pillars (hour day month year): ${four}.` + (dm ? ` Day Master ${dm.hanja} ${dm.pinyin}, ${dm.en}.` : ""));
    if (facts.luck_cycle?.current) lines.push(`Luck cycle starts at age ${facts.luck_cycle.start_age}; current cycle ${facts.luck_cycle.current}; this year's pillar ${facts.year_pillar_now}.`);
  };

  if (tool === "saju_chart" && facts) {
    head();
    const g = (k) => facts.pillars[k];
    lines.push(`Ten Gods: hour ${g("hour")?.stem_ten_god}/${g("hour")?.branch_ten_god}, month ${g("month")?.stem_ten_god}/${g("month")?.branch_ten_god}, year ${g("year")?.stem_ten_god}/${g("year")?.branch_ten_god}; day branch ${g("day")?.branch_ten_god}.`);
    if (facts.structure) lines.push(`Structure (格局): ${facts.structure.name_en}.`);
    if (facts.five_elements?.weighted) lines.push(`Five Elements, weighted with hidden stems: ${fmtRatios(facts.five_elements.weighted)}. Surface (eight characters only): ${fmtRatios(facts.five_elements.surface)}.`);
    Object.assign(hl, facts);
  }

  if (tool === "ohaeng_balance") {
    const o = find(panels, "anal_ohang");
    const r = o && Array.isArray(o.elements) ? Object.fromEntries(o.elements.map((e) => [EL[e.name] || e.name, round1(e.pct)])) : undefined;
    if (r) {
      lines.push(`Five Elements, weighted with hidden stems (percent): ${fmtRatios(r)}. Dominant ${EL[o.dominant] || top(r, 1)}, weakest ${EL[o.weak] || top(r, -1)}.`);
      lines.push("Basis: all eight characters plus hidden stems, seasonally weighted. For the eight visible characters only, see saju_chart (five_elements.surface).");
      hl.five_elements = { basis: "weighted, hidden stems included", ratios: r, dominant: EL[o.dominant] || top(r, 1), weakest: EL[o.weak] || top(r, -1) };
    }
  }

  if (tool === "gyeokguk") {
    const g = find(panels, "anal_gyeokguk");
    if (g) {
      head();
      const s = { name_ko: g.name, name_en: gyeokEn(g.name), grade: g["격종류"] || undefined,
        strength: /^신강/.test(g.gangya_label || "") ? "strong" : /^신약/.test(g.gangya_label || "") ? "weak" : /^중화/.test(g.gangya_label || "") ? "balanced" : undefined,
        strength_level: g.gangya_level ?? undefined };
      const surface = Array.isArray(g.fe_distribution) ? Object.fromEntries(g.fe_distribution.map((e) => [EL[e["오행"]] || e["오행"], round1(e["점수"])])) : undefined;
      const why = facts ? structureRationale({ ...facts, structure: { ...(facts.structure || {}), name_ko: g.name } }) : undefined;
      lines.push(`Structure (格局): ${s.name_en} (${g.name}).` + (s.strength ? ` Day Master ${s.strength}${s.strength_level ? ` (${s.strength_level}/5)` : ""}.` : ""));
      if (why) lines.push(`Why: ${why}`);
      if (surface) lines.push(`Element distribution used here is the surface count (eight characters only): ${fmtRatios(surface)}. The weighted balance is in ohaeng_balance.`);
      Object.assign(hl, { structure: { ...s, rationale: why }, element_distribution: surface ? { basis: "surface, eight characters only", ratios: surface } : undefined });
    }
  }

  if (tool === "eumyang_johu") {
    const b = find(panels, "anal_balance");
    if (b) {
      const st = (x) => (x ? STATE[x["상태"]] || x["상태"] : undefined);
      lines.push(`Natal chart: ${st(b.eumyang)} (yin-yang), ${st(b.johu)} (climate).`);
      const f = b.fortune || {};
      if (f.eumyang?.bl || f.johu?.bl) lines.push(`With the current luck cycle: ${st(f.eumyang?.bl) || "?"}, ${st(f.johu?.bl) || "?"}. With this year: ${st(f.eumyang?.yl) || "?"}, ${st(f.johu?.yl) || "?"}.`);
      Object.assign(hl, { natal: { yin_yang: st(b.eumyang), climate: st(b.johu) },
        luck_cycle: { yin_yang: st(f.eumyang?.bl), climate: st(f.johu?.bl) }, this_year: { yin_yang: st(f.eumyang?.yl), climate: st(f.johu?.yl) } });
    }
  }

  if (tool === "yongshin_candidates") {
    const y = find(panels, "anal_yongshin_quick");
    if (y && Array.isArray(y.yongshins)) {
      const methods = y.yongshins.map((m) => ({ method: METHOD[m.type] || m.type, elements: (m.elements || []).map((e) => EL[e] || e), first: EL[m.primary] || m.primary }));
      const votes = {};
      for (const m of methods) for (const e of m.elements) votes[e] = (votes[e] || 0) + 1;
      const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
      lines.push(methods.map((m) => `${m.method}: ${m.elements.join(", ")}`).join("; ") + ".");
      if (ranked[0]) lines.push(`Most methods include ${ranked[0][0]} (${ranked[0][1]} of ${methods.length}). These are classical candidates, not the engine's final decision.`);
      Object.assign(hl, { methods, agreement: Object.fromEntries(ranked) });
    }
  }

  return { summary_en: lines.join("\n"), highlights: Object.keys(hl).length ? hl : undefined };
}
