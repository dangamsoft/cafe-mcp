# cafe-mcp: Saju & BaZi (Four Pillars of Destiny) MCP server

<!-- mcp-name: io.github.dangamsoft/cafe-mcp -->

**Korean astrology (Saju, 사주) and Chinese BaZi (八字) for AI agents. Computed, not guessed.**
Give Claude, ChatGPT, Cursor or any MCP client a birth date and time. cafe-mcp returns the Four Pillars chart,
luck cycles, a manseryeok (만세력) calendar and the classical texts as **structured, reproducible data** from the
CAFE engine. Your AI writes the reading in the user's language.

[![Remote](https://img.shields.io/badge/Remote-mcp.24plus.ai.kr-blue.svg)](#quick-start)
[![Auth](https://img.shields.io/badge/Auth-OAuth%20%7C%20key-informational.svg)](#quick-start)
[![Version](https://img.shields.io/badge/Version-1.1.0-green.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

> **Why not just ask the LLM?** A general model improvises the chart: the same birth data gives a different
> Day Master on different days, and solar-term boundaries, hidden stems and luck cycles are routinely wrong.
> cafe-mcp calculates them with an engine built since 2019: solar terms to the second, birthplace longitude,
> historical time zones and daylight saving. Same input, same chart, every time.

---

## Quick start

Server URL:

```
https://mcp.24plus.ai.kr/mcp
```

**claude.ai, Claude apps, ChatGPT**: add a custom connector with the URL above, sign in to 24PLUS, then allow.
No key needed.

**Claude Code, Cursor and other clients**: either add the URL and sign in (OAuth), or create a key at
https://24plus.ai.kr/my and send it as a bearer token:

```bash
claude mcp add --transport http cafe-mcp https://mcp.24plus.ai.kr/mcp --header "Authorization: Bearer mcp_live_..."
```

```json
{ "mcpServers": { "cafe-mcp": { "url": "https://mcp.24plus.ai.kr/mcp", "headers": { "Authorization": "Bearer mcp_live_..." } } } }
```

Disconnect any time from **My account > Connected AI**.

## Plans

| | Free | Plus (launching soon) |
|---|---|---|
| Different charts per month | 10 | 100 |
| Tool calls per month | 300 | 3,000 |
| Calls per minute | 20 | 60 |
| Engine judgments (structure, useful element, luck index) | – | ✓ |
| Classics | 3 results, translation excerpt, table of contents | 10 results, full translation, full chapters |

A chart you have already looked up does not count again. Details: https://24plus.ai.kr/pricing

## Tools

| Tool | Plan | What it does |
|---|---|---|
| `saju_chart` | Free | Four pillars with Hanja, Five Elements, Ten Gods, hidden stems, twelve life stages, stars, combinations, clashes and void |
| `luck_cycles` | Free | Ten-year cycles with start ages, yearly and monthly pillars |
| `saju_reading_context` | Free | Chart facts, current luck, term meanings and reading principles in one prompt-ready bundle. The best first call for a reading |
| `manse_calendar` | Free | A month of solar and lunar dates, day pillars, exact solar-term times, auspicious days |
| `find_dates_by_pillars` | Free | Reverse lookup: the dates and times that produce given pillars |
| `find_birthplace` | Free | City search for longitude correction (births outside Korea) |
| `lookup_term` | Free | 980 Saju terms in Korean, Hanja and English |
| `search_classics` | Free | Ziping Zhenquan, Ditian Sui, Qiongtong Baojian and more, original with Korean translation |
| `read_classic` | Free | The library and each book's table of contents (full chapters on Plus) |
| `chart_structure` | Plus | Day Master strength (1 to 5) with its basis, element ratios, structure pattern, climate |
| `useful_element` | Plus | Useful element candidates by five classical methods and the engine's pick |
| `luck_index` | Plus | A 1 to 5 level for each cycle, year or month, with the reasons |

Full reference with inputs and example prompts: https://24plus.ai.kr/docs/tools

Values come back in Korean with Hanja; pass `lang="en"` for English term names.

## Principles

- Calculation is deterministic; interpretation is left to your AI, grounded in the returned data.
- No scores or fixed predictions in the free tools. Levels describe the strength of a tendency.
- Birth data is used only for the calculation. The server keeps a one-way fingerprint for the monthly chart count,
  never the birth date itself. See [PRIVACY.md](PRIVACY.md).

## Before v1.1.0

Until 2026-10-18 this URL served an open server with six tools and no sign-in, and the npm package
`@dangamsoft/cafe-mcp` ran it locally over stdio. Both are retired; the npm package is deprecated.
See [CHANGELOG.md](CHANGELOG.md).

## About

cafe-mcp is run by **24PLUS** (Dangamsoft, Korea), built on the CAFE engine.
Website: https://24plus.ai.kr · Business API (Core API): https://24plus.ai.kr/mcp#business

License: Apache-2.0 for the code in this repository.
