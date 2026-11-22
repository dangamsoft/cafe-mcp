# Why two Saju apps give different charts

Most disagreements are not bugs. They come from a handful of rules that each school or app sets differently.
cafe-mcp returns a `basis` block with every chart so the answer can say which rules were used.

| Rule | The question | CAFE default | Option |
|---|---|---|---|
| Year boundary | Does the year pillar change at 입춘 (Lichun) or at the winter solstice? | Lichun | `year_boundary="dongji"` |
| Month boundary | When exactly does the month pillar change? | At the solar term, to the minute (KST) | — |
| Zi hour | Is 23:00–24:00 the same day (야자시) or the next day (조자시)? | Same day (late) | `zi_hour="early"` |
| Local mean time | Korea Standard Time is set at 135°E; Seoul is about 127°E. Correct the clock time? | Yes, by birthplace longitude | `birthplace_id` |
| Daylight saving | Korea used DST in 1948–51, 1955–60 and 1987–88 | Applied from time-zone history | — |
| Historical time zone | Korea used UTC+8:30 from 1954 to 1961 | Applied | — |
| Lunar leap month | Same lunar date, leap or regular month? | Whatever you pass | `leap_month=true` |

## Try it

The 24 cases in [`boundary-cases/`](../../boundary-cases/) sit exactly on these boundaries. Run any of them through another
tool and compare the pillars; the `basis` of the CAFE result tells you which rule explains a difference.

---
한국어 요약: 사주 앱마다 결과가 다른 건 대개 입춘·동지, 야자시·조자시, 경도 보정, 서머타임, 1954~61년 표준시, 윤달 규칙 차이예요.
cafe-mcp 결과의 `basis` 에 어떤 규칙을 썼는지 들어 있고, `boundary-cases/` 에 경계 사례 24개가 있어요.
