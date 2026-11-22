# Saju boundary cases (경계 사례)

Charts that change at a boundary are where Saju tools disagree. These 24 cases record what the CAFE engine
(the engine behind cafe-mcp) returns at each boundary, so you can compare any other tool against them.

| Group | Cases | What changes |
|---|---|---|
| Year boundary (입춘 Lichun) | ipchun-1 … 4 | Year pillar flips at Lichun (2024-02-04 17:27 KST) |
| Year boundary option (동지) | dongji-1, 2 | Same moment, `year_boundary` = ipchun vs dongji |
| Month boundary (절기) | jeolgi-1, 2 | Month pillar flips at the solar term, to the minute |
| Zi hour (자시 23:00–01:00) | zi-1 … 3 | `zi_hour` = late (야자시, default) vs early (조자시) |
| Local mean time (경도 보정) | lmt-1 … 3 | Korea Standard Time is 135°E; Seoul is about 127°E, so about 32 minutes earlier |
| Daylight saving (서머타임) | dst-1 … 3 | Korean DST years (1948–51, 1955–60, 1987–88) |
| Historical time zone | tz-1, 2 | UTC+8:30 from 1954-03-21 to 1961-08-09 |
| Lunar leap month (윤달) | leap-1 … 3 | Same lunar date, leap vs regular month |
| Unknown birth time | unknown-1 | Three pillars, no hour pillar |
| Before 1900 | old-1 | Dates before modern time zones |

- `cases.input.json` — the inputs and why each case matters (Korean notes).
- `cases.json` — the engine's answer for each case: four pillars and the time correction it applied.
- Same inputs through cafe-mcp: `saju_chart` with `year_boundary` / `zi_hour`; every result carries `basis`.

경계에서 갈리는 사주를 모았어요. 다른 만세력·AI 와 비교할 때 기준으로 쓰세요.
값은 엔진이 계산한 그대로이고, 학파 선택(입춘·동지, 야자시·조자시)은 옵션으로 바꿀 수 있어요.
