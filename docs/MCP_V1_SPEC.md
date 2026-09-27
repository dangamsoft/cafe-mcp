# cafe-mcp v1.0.0 — Global Spec

2026-09-26 · rewrite of the 2026-09-02 draft for a global audience (`MCP_V1_SPEC.md.bak_20260926`)

> Korean summary is at the end (한국어 요약은 맨 아래).

## 1. Positioning

**cafe-mcp is the deterministic Saju / BaZi (Four Pillars) engine for AI agents.**
General LLMs improvise charts and give a different answer each time. cafe-mcp computes the chart with the CAFE engine
(built since 2019, classical rules + an in-house ML yongshin model) and returns structured, reproducible data.
The client LLM writes the prose, in the user's language.

- Discoverability keywords: `saju`, `bazi`, `four pillars`, `chinese astrology`, `korean astrology`, `八字`, `사주`, `四柱推命`.
- Registries: MCP Registry (`io.github.dangamsoft/cafe-mcp`), npm, Glama, Smithery.

## 2. Principles

1. **Contract first.** 1.0 freezes tool names, input/output schemas and error codes. Breaking changes only in 2.0 (semver).
2. **Data, not prose.** Every tool returns `structuredContent` (validated by `outputSchema`) plus a short text summary.
   No server-side translation of narrative; the client LLM localizes.
3. **Language-neutral identifiers.** Stems, branches, elements, ten gods and patterns are returned as stable IDs
   with a label object: `{ "id": "wood", "hanja": "木", "ko": "목", "en": "Wood", "zh": "木", "ja": "木" }`.
4. **No stored birth data.** Birth inputs are used for the calculation and not persisted with any identity (logs keep tool name, timing, status only).
5. **Free tier stays free.** The five v0.6 tools keep working without a key.

## 3. Input (all tools)

| field | type | notes |
|---|---|---|
| `birth` | string, required | ISO 8601 local time `YYYY-MM-DDTHH:mm` (preferred) or legacy `YYYYMMDDHHmm` |
| `sex` | `"female"` \| `"male"`, required | chart direction for luck cycles. Legacy `gender` 0/1 still accepted |
| `calendar` | `"solar"` (default) \| `"lunar"` | `lunar_leap_month: boolean` with lunar |
| `timezone` | IANA name, e.g. `America/New_York` | **new** — replaces the 24Plus-only `loc` ID for births outside Korea. `loc` stays accepted |
| `location` | `{ lat, lon }` optional | enables true solar time correction |
| `time_unknown` | boolean | hour pillar marked as estimated |
| `rat_hour_rule` | `"late"` (야자시, default) \| `"early"` (조자시) | legacy `option1` accepted |
| `year_boundary` | `"lichun"` (입춘, default) \| `"winter_solstice"` (동지) | legacy `option2` accepted |
| `labels` | `["en"]` default | which label languages to include (`en`,`ko`,`zh`,`ja`,`hanja`) |

Validation (zod): real calendar date, 1900–2100, hour/minute range, known timezone. Invalid → `invalid_input` with the field name.

## 4. Tools

| tool | tier | returns |
|---|---|---|
| `saju_chart` | free | four pillars, ten gods, hidden stems, spirit stars, twelve life stages, element ratios, luck-cycle start |
| `ohaeng_balance` | free | five-element percentages (hidden-stem weighted), dominant / weakest |
| `gyeokguk` | free | structure pattern + grade, body strength, sub-patterns |
| `eumyang_johu` | free | yin-yang ratio, climate (hot/cold, dry/wet), shifts across luck cycles |
| `yongshin_candidates` | free | five classical methods with candidate elements (no final pick) |
| `manse_calendar` | free, **new** | a date's day pillar, month/year pillars, and the 24 solar terms of the month with exact times (UTC + local) |
| `yongshin_recommend` | **1 credit** | engine's final favorable element, supporting/avoid elements, per-method agreement, confidence band |
| `cafe_account` | free (key) | credit balance, recent usage |

All tools: `annotations: { readOnlyHint: true, openWorldHint: true }`, a `title`, and an `outputSchema`.

### Resources & prompts (new)
- `cafe://ontology` — the public OWL ontology (Turtle, CC BY 4.0).
- `cafe://glossary/{lang}` — term glossary (stems, branches, ten gods, patterns) in en/ko/zh/ja.
- Prompt `full_reading` — calls the free tools in order and asks the client to write a reading in the user's language, with a disclaimer line.

## 5. Output envelope

```json
{
  "engine": "cafe", "engine_version": "2026.09", "contract": "1.0",
  "input_echo": { "birth": "1990-01-15T10:30", "timezone": "Asia/Seoul", "calendar": "solar" },
  "data": { ... tool-specific ... },
  "notes": ["hour pillar estimated"],
  "links": { "web": "https://24plus.ai.kr/manse?s=<chart-hash>" }
}
```
Text summary: 3–6 lines (chart basis, key result), no marketing copy inside the data.

## 6. Errors

`isError: true` + `structuredContent.error`:

| code | meaning |
|---|---|
| `invalid_input` | field-level validation failed (`field`, `reason`) |
| `api_key_required` | paid tool without a key (`portal` URL) |
| `insufficient_credits` | balance 0 (`portal` URL, `balance`) |
| `rate_limited` | free tier limit hit (`retry_after_s`) |
| `backend_unavailable` / `timeout` | engine or network issue; never charged |

Backend raw messages are never forwarded.

## 7. Keys, credits, pricing

- Env `CAFE_MCP_API_KEY` → header `X-Cafe-Key`. Keys are issued at the portal (sign in with Google/email). Keys are hashed at rest.
- **Credits are MCP-only** (separate from the consumer 푼 wallet on 24plus.ai.kr). Priced in **USD**.
- Payments via **Lemon Squeezy** as Merchant of Record (global VAT/sales tax, invoices, refunds). Toss for KR businesses later if needed.
- Packs (2026-09-26 proposal):

  | pack | price | per credit | note |
  |---|---|---|---|
  | Trial | free | - | 10 credits on first key |
  | Starter | $5 | $0.10 (50 cr) | minimum pack; payment fee stays ~15% |
  | Builder | $20 | $0.08 (250 cr) | expected main pack |
  | Pro | $60 | $0.06 (1,000 cr) | |
  | Scale | $200 | $0.04 (5,000 cr) | above this: contact / invoice |

  Credits valid 12 months. Rationale: raw chart math is a commodity on the market (≈$0.0001–0.01 per call),
  so the six calculation tools stay free; only the engine's judgment (`yongshin_recommend`) is paid.
  $0.04–0.10 per judgment is ~1% of the consumer report price (₩7,900), so it does not cannibalize the web product
  and leaves resale margin for developers. Review after 3 months of usage data.
- Charge exactly once, **after** a successful engine result. Webhooks idempotent on `order_id`. Every charge has a `request_id` returned to the client.
- Free tier: 60 calls/hour per IP, 1,000/day per key (keys also unlock higher free limits).

## 8. Endpoints

- API: `https://api.24plus.ai.kr/v1/{tool}` (nginx → :9000, router `d25mcp_api/routers/mcp_v1/`). `/api/try/panels` kept for ≤0.6 clients until 2027-03.
- Portal: `https://24plus.ai.kr/mcp` — landing, docs (generated from the tool schemas), pricing, dashboard (keys, balance, usage).
  Languages: **en (default), ko, ja, zh**; all strings in message files.
- Remote MCP (Streamable HTTP + OAuth) at `mcp.24plus.ai.kr`: **v1.1**, so Claude.ai / ChatGPT connectors work without install.

## 9. Legal & trust (global)

- Terms of Service and Privacy Policy for the API in English (Korean version prevails for KR users). GDPR/CCPA: birth data not stored, usage logs 12 months, DPA on request.
- Output disclaimer field: `"disclaimer": "For cultural and entertainment purposes; not medical, legal or financial advice."`
- License: server code Apache-2.0, ontology CC BY 4.0, engine proprietary (not bundled).

## 10. Release plan

1. **0.9.0** — contract: `McpServer.registerTool`, zod input, `outputSchema` + `structuredContent`, error codes, label objects,
   ISO/timezone inputs (legacy fields kept), single version source, contract tests (snapshot of the five free tools vs 0.6.4), CI `npm pack` + `npx` smoke test.
2. **0.9.x** — resources, `full_reading` prompt, `manse_calendar`.
3. Backend `mcp_v1`: key check → engine → charge; Lemon Squeezy checkout + webhook; portal (en first, then ko/ja/zh).
4. **1.0.0** — `yongshin_recommend`, `cafe_account`; README English-first (Korean section kept), server.json/glama.json/CHANGELOG; npm + registry publish; move recovery codes out of the repo before publish.
5. **1.1** — remote MCP + OAuth.

## 11. Acceptance checklist

- [ ] Free five tools: same values as 0.6.4 for 20 reference charts (KR + 5 overseas timezones)
- [ ] Overseas birth via `timezone` equals the same chart via legacy `loc`
- [ ] Paid tool: no key → `api_key_required`; balance 0 → `insufficient_credits`; engine failure → no charge
- [ ] Duplicate webhook → single top-up
- [ ] Same chart ×3 → identical `structuredContent` (glyph order sorted)
- [ ] Portal en/ko/ja/zh render with no hard-coded strings
- [ ] Output passes `outputSchema` validation in CI

## 12. Open decisions

Pack prices · free-tier limits · whether `yongshin_recommend` includes confidence numbers or only bands · `ilju_profile` as a second new free tool · legacy field removal date.

---

## 한국어 요약

- **목표**: 전 세계 AI 에이전트가 쓰는 결정적(같은 사주 = 같은 답) 사주·바쯔 엔진. 풀이 문장은 클라이언트 AI가 사용자 언어로 쓴다.
- **바뀌는 점**: 결과를 구조화 데이터(`structuredContent`)로 주고, 간지·오행은 언어 중립 ID + 다국어 라벨로 준다. 입력은 ISO 날짜·IANA 시간대·위경도를 받아 해외 출생을 제대로 처리한다(기존 `loc`·0/1 필드도 계속 받음).
- **도구**: 무료 5종 유지 + 무료 `manse_calendar`(일진·절기 시각) + 유료 `yongshin_recommend`(1크레딧) + `cafe_account`.
- **과금**: 푼과 분리된 MCP 전용 크레딧, 달러 가격, Lemon Squeezy(해외 부가세·영수증 대행). 성공한 호출만 1회 차감.
- **포털**: `24plus.ai.kr/mcp`, 영어 기본 + 한·일·중. 원격 접속(설치 없이 Claude.ai 등에서 연결)은 1.1.
- **순서**: 0.9(계약 정리·테스트) → 0.9.x(리소스·프롬프트·만세력 도구) → 백엔드·결제·포털 → 1.0 → 1.1 원격.

---

## 2026-09-26 결정 (범위 변경)

- **1.0.0 = 전부 무료 + 원격 서버.** 도구 6개(무료 5종 + `manse_calendar`), 계약 고정, stdio와 원격(Streamable HTTP, `https://mcp.24plus.ai.kr/mcp`) 동시 제공.
- 유료(`yongshin_recommend`, `cafe_account`, 키·크레딧, Lemon Squeezy, 포털)는 사용량을 본 뒤 **1.1 이후** 도구 추가 방식으로 붙인다. 기존 도구는 계속 무료.
- 원격 서버는 무상태, 인증 없음, IP당 분당 120회. claude.ai 등은 공용 IP로 붙으므로 IP 제한을 낮게 잡지 않는다.
- 오류 결과는 `structuredContent` 없이 `isError` + JSON 텍스트 블록으로 반환 (클라이언트의 outputSchema 검증 통과).
- `manse_calendar`는 백엔드 `calendar` 프리셋(`xl_value`) 재사용. 공망일 등 명식 기준 값은 제외.
