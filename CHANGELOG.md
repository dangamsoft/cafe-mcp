# Changelog

## v1.0.1 (2026-09-27)

Remote server load guard. No change to tools, inputs or outputs (contract stays 1.0).

- `cafe-mcp-http`: tool calls are capped per IP per minute (`RATE_LIMIT_PER_MIN`, default now 20), in flight at once (`MAX_CONCURRENT_CALLS`, default 3, over the cap returns a "busy, retry" error) and per day (`DAILY_CALL_LIMIT`, default 5000, resets 00:00 KST). `initialize`, `tools/list` and `ping` only count toward the per-IP limit.
- Opening `/mcp` in a browser now redirects to the documentation instead of showing a JSON error.
- `/health` reports calls in flight and calls today.

## v1.0.0 — 2026-09-26

First stable contract ([spec](./docs/MCP_V1_SPEC.md)): tool names, input/output schemas and error codes are frozen until 2.0.
All tools are free. v0.6 arguments keep working. (0.9.0 was prepared but not published; its changes ship here.)

### Added
- **Remote server** (`http.js`, bin `cafe-mcp-http`): MCP Streamable HTTP, stateless, JSON responses, per-IP rate limit, `/health`. Hosted at `https://mcp.24plus.ai.kr/mcp`.
- **`manse_calendar`** tool: day, month and year pillars, lunar dates, solar terms with exact start time (KST), 손없는날 / 황도일 flags for a month or a single day. No birth data needed.
- **Structured output**: every tool returns `structuredContent` validated by an `outputSchema`
  (`engine`, `contract`, `tool`, `input_echo`, `basis`, `data.panels`, `links`, `disclaimer`) plus a short text summary.
- **Input validation** (zod): real calendar dates 1900–2100, ISO `YYYY-MM-DDTHH:mm` or legacy 12 digits.
- Readable option names: `sex`, `calendar`, `lunar_leap_month`, `rat_hour_rule`, `year_boundary` (legacy `gender`, `is_lunar`, `is_leap_year`, `option1`, `option2` still accepted).
- Tool `title`s and annotations (`readOnlyHint`, `openWorldHint`, `idempotentHint`).
- Resource `cafe://ontology` (bundled OWL 2 Turtle) and prompt `full_reading`.
- Contract tests (`npm test`, mocked backend) and CI on Node 18/20/22 with `npm pack` and stdio checks.

### Changed
- Errors are stable codes (`invalid_input`, `rate_limited`, `timeout`, `backend_unavailable`), returned with `isError` and a JSON text block `{"error": {...}}` (no `structuredContent`, so clients that validate output schemas accept them); backend error bodies are no longer forwarded.
- Moved to `McpServer.registerTool`; server factory in `server.js`, `index.js` is the stdio entry.
- Version is read from `package.json` (single source).
- Removed the marketing line appended to raw JSON; the web link now lives in `links.web` and the text summary.

## v0.6.4 — 2026-06-20

### Added
- **saju_chart** now includes Spirit Stars (神殺 / 신살) and Twelve Life Stages
  (十二運星 / 십이운성) annotations on each pillar, alongside the existing pillars,
  Ten Gods, and five-element ratios. (Backend: `saju` preset gains the
  `anal_sinsal` panel via `bas_sal`.)

### Changed
- Improved all five tool descriptions for clarity and tool-selection accuracy
  (TDQS) — each now states its actual returned fields and adds Korean/English
  trigger phrases.

## v0.6.3 — 2026-06-18

### Fixed
- **`server.json` install metadata** — added `runtimeHint: "npx"` and
  `registryBaseUrl: "https://registry.npmjs.org"` to the npm package entry so
  installers/indexers (Glama, registry) can resolve and launch the stdio
  package. Fixes Glama "cannot be installed" + empty-tools indexing.

### Changed
- README: corrected stale "planned MCP integration" wording and the
  `MCP-planned` badge to reflect the live server (v0.6.3).
- LICENSE: filled the Apache-2.0 copyright placeholder (`Dangamsoft`) for
  cleaner SPDX/license detection.

## v0.6.2 — 2026-06-11

### Added
- **[기본정보] text header** prepended to every tool output — the backend-built
  `base_info_text` (pillars in hour-day-month-year order, calendar & season
  basis, gender, age, luck-cycle start, current major/yearly luck, Rat-hour
  rule). Same header the 24Plus web prompt uses; values derive from the actual
  chart computation, so the header always matches the chart. Backends without
  the field → no header (safe with older backends).
- **Chart option inputs** on all 5 tools (backend already accepted these):
  - `option1` — Rat-hour (자시) rule: `0` Ya-jasi (default) / `1` Jo-jasi
  - `option2` — year-pillar season basis: `0` Ipchun (default) / `-1` Dongji
  - `loc` — birthplace region ID for overseas births
  - `is_leap_year` — lunar leap-month flag (with `is_lunar`)
  - `time_unknown` — marks the hour pillar as estimated in the header
  Strict coercion: only exact enum values are forwarded (e.g. only `-1` means
  Dongji; anything else falls back to the Ipchun default).
- `X-Channel: mcp` request header — channel marker for backend usage
  analytics (`mcp_usage_log`). Older backends ignore it.

## v0.6.1 — 2026-06-11

### Added
- `mcpName: io.github.dangamsoft/cafe-mcp` in `package.json` for Official MCP
  Registry ownership verification.
- `server.json` (registry metadata) for publishing to registry.modelcontextprotocol.io.

### Fixed
- `bin` value `./index.js` → `index.js` (npm 11 publish-time validation
  stripped the `./`-prefixed entry, breaking `npx`).

## v0.6.0 — 2026-06-01

### Added
- Local (stdio) MCP server (`index.js`) exposing **5 free birth-chart tools** —
  `saju_chart`, `ohaeng_balance`, `gyeokguk`, `eumyang_johu`,
  `yongshin_candidates` — forwarding to the 24Plus backend `POST /try/panels`
  (panel-extracted safe data only; no raw engine output).
- Published as `@dangamsoft/cafe-mcp` on npm.

## v0.5.3 — 2026-05-03

### Fixed
- `ontology/cafe-ontology.ttl` 헤더 정합 수정:
  - `owl:versionInfo`: `0.4.0` → `0.5.3` (패키지 버전과 일치)
  - rdfs:comment 표현 정리

### Changed
- `ontology/README.md`:
  - Version 배지: `0.5.0` → `0.5.3`
  - 다이어그램 표현을 메인 README와 통일 (ML ensemble)
  - Changelog 섹션 정리 + v0.5.3 entry
- 메인 `README.md` Version 배지: `0.5.1` → `0.5.3`

---

## v0.5.2 — 2026-05-02

### Added
- README의 Enterprise tier contact 이메일 명시: **info@dangamsoft.com**

### Confirmed
- Indie 가격: $19/mo
- Free quota: 30회/mo (cafe_analysis paid 기준)
- Enterprise contact: info@dangamsoft.com

---

## v0.5.1 — 2026-05-02

### Changed
- README 표현 정리 — 추상화 및 일부 항목 정리
- `Inference engine` 표현 추상화: `ML ensemble`
- `Calendar engine` 표현 단순화: multi-school options 중심
- `Built by` 섹션 단순화
- ontology/README의 CAFE 엔진 섹션도 동일 기준으로 정리

### Kept
- Performance 표 (91.10% / ROC AUC 97.76% / F1 / Precision / Recall) — 핵심 가치 제안
- `1,711 RDF triples`, `18 patterns`, `5 yongshin`, `75 sinsal` 온톨로지 통계
- Tier별 가격 노출 (Free / Indie $19 / Studio $99 / Business $499 / Enterprise)

---

## v0.5.0 — 2026-05-02

### Added
- **격국 종세격 (從勢格)** — `saju:FollowingMomentumPattern`
  - 식상·재성·관살 세 세력의 혼합 기세에 종(從)하는 격국
- **격국 종기격 (從氣格)** — `saju:FollowingChiPattern`
  - 두 오행이 결합된 큰 세력에 종하는 격국
  - 금수종(金水), 목화종(木火), 화토종(火土) 등
- 정격 10종 모두에 `saju:groundedIn saju:Jajupyeongjinjeon` 매핑 추가
- README에 `cafe_basic` / `cafe_analysis` 도구 명세 추가
- README에 5-tier Pricing 섹션 추가

### Changed
- 격국 분류 17종 → **18종** (정격 10 + 특수격 8 + 부모 2)
- 통합본 트리플 카운트: 1,672 → **1,711** (+39)
- 통합본의 EXTENDED PATTERN SUBCLASSES 중복 블록 제거

### Removed
- patterns.ttl의 중복된 EXTENDED PATTERN SUBCLASSES 섹션
- cafe-ontology.ttl 끝부분의 중복 lineage mapping 블록

### Fixed
- patterns.ttl 모듈 단독 파싱 검증 통과 (163 triples)
- 모든 모듈 단독/통합 파싱 일관성 검증

---

## v0.4.0 — 2026-05-02 (Initial public release)

### Initial public ontology release
- 격국 17종 (정격 10 + 특수격 6 + 부모 2)
- 용신 5종 (격국/억부/병약/조후/통관, 전왕 제외)
- 신살 75종
- 6대 고전 매핑
- 통합본 1,672 triples
- 옵션 B 라벨 정책 (음역 + 표준 영어)
- CC BY 4.0 라이선스
