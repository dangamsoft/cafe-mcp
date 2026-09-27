# cafe-mcp: Saju & BaZi (Four Pillars of Destiny) MCP server

<!-- mcp-name: io.github.dangamsoft/cafe-mcp -->

**Korean astrology (Saju, 사주) and Chinese BaZi (八字) for AI agents. Computed, not guessed.**
Give Claude, ChatGPT, Cursor or any MCP client a birth date and time. cafe-mcp returns the Four Pillars chart,
Day Master, Five Elements balance, chart structure, favorable-element candidates and a manseryeok (만세력) calendar
as **structured, reproducible JSON** from the CAFE engine. Your AI writes the reading in the user's language.

[![MCP](https://img.shields.io/badge/MCP-live%20v1.0.0-brightgreen.svg)](https://modelcontextprotocol.io)
[![Remote](https://img.shields.io/badge/Remote-mcp.24plus.ai.kr-blue.svg)](#quick-start)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![W3C OWL 2](https://img.shields.io/badge/W3C-OWL%202-orange.svg)](https://www.w3.org/TR/owl2-overview/)
[![Ontology](https://img.shields.io/badge/Ontology-1%2C711%20triples-brightgreen.svg)](./ontology/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](#)

> **Why not just ask the LLM?** A general model improvises the chart: the same birth data gives a different
> Day Master on different days, and solar-term boundaries, hidden stems and luck cycles are routinely wrong.
> cafe-mcp calculates them with an engine built since 2019 (3,000+ chart features, interpretation method
> reviewed by a PhD in Myeongri, favorable-element model validated at 91.1% accuracy). Same input, same chart, every time.
> **All 6 tools are free. No API key.**

---

## Quick start

**No API key, no local engine, no database.** Two ways to connect:

**1. Remote (no install)**: add a custom connector with this URL, e.g. in Claude (Settings > Connectors),
ChatGPT (Developer mode) or any client that supports Streamable HTTP:

```
https://mcp.24plus.ai.kr/mcp
```

**2. Local (stdio)**: Claude Desktop `claude_desktop_config.json` (Cursor: `~/.cursor/mcp.json`, Claude Code: `claude mcp add cafe-mcp -- npx -y @dangamsoft/cafe-mcp`):

```json
{
  "mcpServers": {
    "cafe-mcp": {
      "command": "npx",
      "args": ["-y", "@dangamsoft/cafe-mcp"]
    }
  }
}
```

**Self-host the remote server**: `npx -p @dangamsoft/cafe-mcp cafe-mcp-http` (env `PORT`, `HOST`, `TRUST_PROXY=1` behind a proxy, `RATE_LIMIT_PER_MIN`).

## What you can ask

- *"Show my BaZi chart for 1990-01-15 10:30, male."*
- *"What is my Day Master, and which element am I missing?"*
- *"Is my chart hot or cold? Which element balances it?"*
- *"What are my favorable element (Yongshin) candidates, and why?"*
- *"What is today's day pillar?"* / *"When exactly does Lichun (입춘) start in 2027?"*
- *"Good days to move house next month?"* (손없는날 / 황도일 flags)
- *"내 사주 격국이랑 조후 봐줘"* (Korean works too; the tools are language-neutral)

Works in Claude (web, desktop, mobile), Claude Code, ChatGPT, Cursor, Windsurf and any client that speaks MCP.

## Tools (free, no key)

| Tool | Returns |
|------|---------|
| `saju_chart` | Four Pillars (四柱八字): stems and branches, Day Master (日干), Ten Gods (十神), hidden stems, Spirit Stars (神殺), Twelve Life Stages (十二運星) |
| `ohaeng_balance` | Five Elements (五行) distribution, dominant / weakest element |
| `gyeokguk` | Chart structure (格局) and Day Master strength (身强 / 身弱) |
| `eumyang_johu` | Yin-Yang and climate (陰陽 調候) balance across luck cycles (大運) |
| `yongshin_candidates` | Favorable element (用神) candidates from 5 classical methods (격국, 억부, 병약, 조후, 통관) |
| `manse_calendar` | Manseryeok (萬歲曆): day / month / year pillars, lunar dates, 24 solar terms (節氣) with exact start time (KST), Korean holidays, 손없는날 / 황도일, for a month (`month: "2027-02"`) or a day (`date: "2027-02-04"`); no birth input |

Every tool is read-only and returns `structuredContent` (with an `outputSchema`) plus a short text summary,
so the model reads the numbers instead of parsing prose.

**Input** (chart tools)

| field | example | notes |
|---|---|---|
| `birth` | `1990-01-15T10:30` | local time; legacy `199001151030` also accepted |
| `sex` | `female` / `male` | legacy `gender` 0/1 accepted |
| `calendar` | `solar` (default) / `lunar` | `lunar_leap_month` for leap months |
| `rat_hour_rule` | `late` (default) / `early` | 야자시 / 조자시 (late vs early Rat hour) |
| `year_boundary` | `lichun` (default) / `winter_solstice` | 입춘 / 동지 (year starts at Lichun or the winter solstice) |
| `time_unknown` | `true` | hour pillar marked as estimated |
| `loc` | `259` | births outside Korea (24Plus world-city ID); other IANA time zones are rejected rather than guessed |

**Errors** return `isError: true`, a readable first text block, and a JSON second block `{"error": {"code", "field?", "message"}}` with codes `invalid_input`, `rate_limited`, `timeout`, `backend_unavailable`.

**Resources & prompts**: `cafe://ontology` (OWL 2 Turtle, CC BY 4.0) and the `full_reading` prompt.

> **Calculation tools stay free.** The engine's final favorable-element decision (ML cross-validated) and full reports
> are part of the 24Plus service; a keyed `yongshin_recommend` tool may be added in a later minor version without changing these tools.

**Custom backend:** set `CAFE_MCP_API_URL` (the server POSTs to
`${CAFE_MCP_API_URL}/try/panels`; default `https://24plus.ai.kr/api`).

---

## Why cafe-mcp

| | LLM-only readings | Calculator-only servers | **cafe-mcp** |
|---|---|---|---|
| Chart math (pillars, hidden stems, solar terms) | improvised | computed | **computed** |
| Ten Gods, Spirit Stars, Twelve Life Stages | often wrong | sometimes | **computed** |
| Chart structure (格局) and favorable-element candidates | guessed | usually absent | **classical rules, ML-validated engine** |
| Korean Saju conventions (야자시, 입춘 / 동지, 손없는날) | no | rarely | **yes, switchable** |
| Output | prose | text | **`structuredContent` + `outputSchema`** |
| Setup | none | npm install | **remote URL, no install (or npx)** |
| Price | n/a | varies | **free, no key** |

### Saju or BaZi?

Korean Saju (사주명리학) and Chinese BaZi (八字命理) share the same chart and the same classical roots
(子平眞詮, 滴天髓, 窮通寶鑑 and others). The differences are conventions: Korea commonly applies the late Rat hour
(야자시) rule, starts the year at Lichun (입춘), and uses its own manseryeok and holiday calendar. cafe-mcp follows
the Korean school by default and exposes those switches, so it serves both audiences. Names use Korean
romanization with Hanja kept: Yongshin = 用神 (favorable element), Gyeokguk = 格局 (chart structure),
Sinsal = 神殺 (Spirit Stars), Ilgan = 日干 (Day Master). See [Notes on traditions](#note-on-east-asian-myeongli-traditions).

### What the MCP does not do

It does not write the reading. It returns the chart and the classical analysis; the client model interprets it
in the user's language. It also does not return the engine's single final Yongshin decision (see the note above).

---

## Ontology

- **1,711 RDF triples**, SPARQL-queryable, W3C OWL 2 conformant
- Models:
  - 60갑자 (Sexagenary cycle)
  - 75 sinsal (special-star annotations)
  - **18 patterns**: 정격 10 + 특수격 8
  - 5 yongshin types: 격국, 억부, 병약, 조후, 통관
  - 12 life stages (12운성)
- Grounded in 6 classical treatises:
  - 적천수 (Diqianshui)
  - 자평진전 (Zipingzhenquan)
  - 난강망 (Lanjiangwang)
  - 궁통보감 (Qiongtongbaojian)
  - 연해자평 (Yuanhaiziping)
  - 삼명통회 (Sanmingtonghui)

See [`ontology/`](./ontology/) for module structure, SPARQL examples, and
the integrated turtle file (`cafe-ontology.ttl`). The ontology is the public layer of the CAFE engine
(**C**ross-weighted **A**nalysis of the **F**ive **E**lements), released under CC BY 4.0 for academic use,
system integration and downstream development.

---

## CAFE engine performance

The CAFE engine, the inference system this ontology models, operates
inside the 24Plus platform. Validated performance on 5-class yongshin
classification (목/화/토/금/수, 5-fold cross-validated):

| Metric                  | Result   |
|-------------------------|----------|
| Accuracy                | 91.10%   |
| F1-Score (Macro)        | 91.08%   |
| Precision (Macro)       | 91.16%   |
| Recall (Macro)          | 91.10%   |
| ROC AUC (Macro)         | 97.76%   |

Random baseline = 20% (5 classes). 4.56x better than random. ML ensemble
with weighted voting and probability calibration.

The engine itself remains proprietary; the ontology models the domain
structure it operates on.

---

## Note on East Asian Myeongli traditions

This MCP focuses on the Korean Myeongli (사주명리학) tradition, which
shares its classical roots (子平眞詮 Zipingzhenquan, 滴天髓 Diqianshui,
窮通寶鑑 Qiongtongbaojian, 淵海子平 Yuanhaiziping, 三命通會 Sanmingtonghui,
欄江網 Lanjiangwang) with the Chinese BaZi (八字) tradition.

Romanization uses Korean Revised Romanization (e.g., Yongshin, Sinsal).
Hanja (정자) is preserved throughout the ontology.

---

## Documentation

- [Ontology specification](./ontology/): formal OWL ontology with SPARQL examples
- [Changelog](./CHANGELOG.md)
- [24Plus MCP docs (Korean)](https://24plus.ai.kr/partner/docs)

---

## Built by

[Dangamsoft (단감소프트)](https://24plus.ai.kr), a Korean AI company
specializing in classical East Asian knowledge systems. The same engine powers the 24Plus Saju service.

---

## License

- **Code** (live since v0.6.0): Apache 2.0
- **Public OWL ontology** ([`ontology/`](./ontology/)): CC BY 4.0

The CAFE inference engine, scoring algorithms, ML model weights, and
interpretation templates remain proprietary.

---

## 한국어 요약

cafe-mcp는 사주명리 계산을 AI 에이전트에 붙이는 MCP 서버입니다. Claude, ChatGPT, Cursor 등 MCP를 지원하는
클라이언트에 원격 URL(`https://mcp.24plus.ai.kr/mcp`) 하나만 등록하면 설치 없이 바로 쓸 수 있고,
`npx -y @dangamsoft/cafe-mcp`로 로컬(stdio) 실행도 됩니다.

- 도구 6종 모두 무료, API 키 없음: 사주 원국(`saju_chart`), 오행 분포(`ohaeng_balance`), 격국(`gyeokguk`),
  음양·조후(`eumyang_johu`), 용신 후보(`yongshin_candidates`), 만세력(`manse_calendar`: 일진·월주·년주, 음력, 절기 입절 시각, 공휴일, 손없는날·황도일)
- 야자시/조자시, 입춘/동지 기준, 음력·윤달, 시간 미상, 해외 출생지를 입력으로 지정할 수 있습니다.
- 결과는 `structuredContent` + `outputSchema`로 돌려주므로 모델이 문장을 파싱하지 않고 숫자를 그대로 읽습니다.
- 온톨로지(OWL 2, 1,711 트리플)는 CC BY 4.0, 코드는 Apache 2.0입니다. 엔진의 최종 용신 판정과 전체 리포트는
  24Plus 서비스(https://24plus.ai.kr)에서 제공합니다.
