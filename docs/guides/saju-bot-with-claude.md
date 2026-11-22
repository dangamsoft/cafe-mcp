# Build a Saju consultation assistant with Claude and cafe-mcp

The model writes the reading; the CAFE engine computes the chart. That split keeps every pillar, Ten God and luck cycle
reproducible, and lets the model spend its effort on explanation.

## 1. Connect

| Client | How |
|---|---|
| Claude (claude.ai, Desktop) | Settings → Connectors → Add custom connector → `https://mcp.24plus.ai.kr/mcp` (sign in once) |
| Claude Code | `claude mcp add --transport http cafe-mcp https://mcp.24plus.ai.kr/mcp` |
| ChatGPT, Cursor, others | Add a remote MCP server with the same URL |

## 2. A good first question

> I was born on 1990-05-15 at 14:30, female. Explain my Saju chart simply.

The model calls `saju_chart` (use `detail="summary"` for a short answer). Dates and times in everyday forms
(`1990/5/15`, `오후 2시 30분`, `2:30 PM`) are accepted; if something is off, the tool says how to fix the call.

## 3. Going further

| You want | Tool |
|---|---|
| Where am I in my 10-year cycle, this year, the next months | `luck_cycles` (period `daeun`, `year`, `month`) |
| One prompt-ready bundle for a full reading | `saju_reading_context` |
| A day in the Saju calendar (일진, solar terms, 손없는날) | `manse_calendar` |
| Which birth times give these pillars | `find_dates_by_pillars` |
| A term's meaning, or the classical source | `lookup_term`, `search_classics`, `read_classic` |

The server also ships prompts (in Claude's "+" menu): *Explain my chart simply*, *My luck timing this year*,
*Check a date in the Saju calendar*.

## 4. Rules that keep readings honest

- Never let the model recompute or "correct" pillars; quote the tool values.
- Speak in tendencies, not fate. The tools return no scores, so the model should not invent any.
- When charts differ from another app, read `basis` (year boundary, zi hour, time correction, DST) and say why.
- Judgments such as the useful element (용신), structure, compatibility and fortune are not in the free tools.
  Businesses get them through the CAFE Core API: <https://24plus.ai.kr/business>.

---
한국어 요약: Claude 에 `https://mcp.24plus.ai.kr/mcp` 를 커넥터로 붙이면 사주 계산은 CAFE 엔진이, 풀이 글은 AI 가 써요.
「쉽게 설명해 줘」는 `saju_chart` 요약, 운의 흐름은 `luck_cycles`, 전체 풀이는 `saju_reading_context` 를 써요.
