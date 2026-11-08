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

cafe-mcp is free with a 24PLUS account.

| | Free | Business |
|---|---|---|
| Different charts per month | 10 | by agreement |
| Tool calls per month | 300 | by agreement |
| Calls per minute | 20 | by agreement |
| Tools | the 9 tools below | CAFE Core API |
| Engine judgments (useful element, chart structure, luck index, personality, compatibility, fortune) | – | ✓ |
| Classics | 3 results, translation excerpt, table of contents | full translation, full chapters |

A chart you have already looked up does not count again. Engine judgments and use inside your own product
go through the CAFE Core API under a business agreement: https://24plus.ai.kr/mcp#business

## Tools

The server lists **9 read-only tools**, all free.

| Tool | What it does |
|---|---|
| `saju_chart` | Four pillars with Hanja, Five Elements, Ten Gods, hidden stems, twelve life stages, stars, combinations, clashes and void |
| `luck_cycles` | Ten-year cycles with start ages, yearly and monthly pillars |
| `saju_reading_context` | Chart facts, current luck, term meanings and reading principles in one prompt-ready bundle. The best first call for a reading |
| `manse_calendar` | A month of solar and lunar dates, day pillars, exact solar-term times, auspicious days |
| `find_dates_by_pillars` | Reverse lookup: the dates and times that produce given pillars |
| `find_birthplace` | City search for longitude correction (births outside Korea) |
| `lookup_term` | 980 Saju terms in Korean, Hanja and English |
| `search_classics` | Ziping Zhenquan, Ditian Sui, Qiongtong Baojian and more, original with a Korean translation excerpt |
| `read_classic` | The library and each book's table of contents |

Full reference with inputs and example prompts: https://24plus.ai.kr/docs/tools

### About the engine's useful element judgment

The useful element (yongshin) is not part of the public tools; it is available through the CAFE Core API.
CAFE looks at a chart from several classical methods (eokbu/support, johu/climate, byeongyak/illness-remedy,
tonggwan/mediation, gyeokguk/structure including jonggyeok/following), and a model trained on classical and real
consultation cases picks among their candidates.

**Useful/favorable-element agreement (희용신 일치율): 75%.** On charts not used in training, the expert's useful element
is within the useful/favorable pair CAFE gives for 75% of charts; for the single useful element alone it is 56%
(cross-validated, 2026-10-10).

Values come back in Korean with Hanja; pass `lang="en"` for English term names.

## Principles

- Calculation is deterministic; interpretation is left to your AI, grounded in the returned data.
- No scores, grades or fixed predictions.
- Birth data is used only for the calculation. The server keeps a one-way fingerprint for the monthly chart count,
  never the birth date itself. See [PRIVACY.md](PRIVACY.md).
- The old local npx wrapper (`npx @dangamsoft/cafe-mcp`) does not calculate on your machine either: it sends the
  birth date, time and sex to the 24PLUS server to compute the chart.

## Before v1.1.0

Until 2026-10-18 this URL served an open server with six tools and no sign-in, and the npm package
`@dangamsoft/cafe-mcp` ran it locally over stdio. Both are retired; the npm package is deprecated.
See [CHANGELOG.md](CHANGELOG.md).

## About

cafe-mcp is run by **24PLUS** (Dangamsoft, Korea), built on the CAFE engine.
Website: https://24plus.ai.kr · Business API (Core API): https://24plus.ai.kr/mcp#business

License: Apache-2.0 for the code in this repository.
