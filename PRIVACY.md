# cafe-mcp privacy policy

Last updated: 2026-09-27. Applies to the remote server at `https://mcp.24plus.ai.kr/mcp` and to the
`@dangamsoft/cafe-mcp` package when it calls the default backend (`https://24plus.ai.kr/api`).
Operator: Dangamsoft (단감소프트), Republic of Korea. Contact: info@dangamsoft.com

## What the server receives

Only the arguments of the tool you call:

- chart tools: birth date and time, sex, calendar (solar or lunar), leap-month flag, Rat-hour rule,
  year-boundary rule, "time unknown" flag, and an optional world-city ID for births outside Korea;
- `manse_calendar`: a month or a date.

No name, email, account, location, device identifier or conversation text is requested or received.
There are no accounts and no cookies.

## How it is used

The arguments are passed to the 24Plus CAFE engine (servers in Seoul, Korea) to compute the chart,
and the result is returned to your AI client. They are not used for anything else, not used to
train models, not sold, and not shared with third parties.

## What is kept, and for how long

- **Result cache.** To avoid recomputing identical requests, the arguments and the computed result
  are cached on the server, keyed to the Korean calendar day (KST). An entry is never reused after
  its day and is purged automatically the next day.
- **Usage statistics.** For each call we record: channel (web or MCP), tool, status, sex,
  calendar type, year-boundary rule, number of result panels and processing time.
  Birth date and time are not recorded in these statistics.
- **Rate-limit counters.** Your IP address is used to count requests per minute; counters are
  deleted after five minutes.
- **Server access logs.** The web server keeps standard access logs (IP address, time, path, status
  code, without request bodies) for security and troubleshooting, under routine log rotation.

## Your choices

- Run the server locally (`npx -y @dangamsoft/cafe-mcp`) with `CAFE_MCP_API_URL` pointed at your
  own backend if you do not want requests to reach our servers.
- Ask about or request deletion of any data related to your requests: info@dangamsoft.com.

## Changes

Changes to this policy are published in this file with a new date.
