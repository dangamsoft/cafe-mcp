# Connect cafe-mcp to any AI app

cafe-mcp runs on the 24PLUS server at `https://mcp.24plus.ai.kr/mcp`. It is free with a 24PLUS account
(10 different charts and 300 tool calls a month). Pick the way your app supports.

## Apps that sign in (no key)

| App | How |
|---|---|
| claude.ai, Claude Desktop | Settings → Connectors → Add custom connector → `https://mcp.24plus.ai.kr/mcp`, then sign in to 24PLUS and allow |
| ChatGPT | Add a custom connector (MCP) with the same URL where your plan allows it, then sign in |

## Apps that take a URL and a key

Create a key at https://24plus.ai.kr/my, then:

```bash
claude mcp add --transport http cafe-mcp https://mcp.24plus.ai.kr/mcp --header "Authorization: Bearer mcp_live_..."
```

```json
{ "mcpServers": { "cafe-mcp": { "url": "https://mcp.24plus.ai.kr/mcp", "headers": { "Authorization": "Bearer mcp_live_..." } } } }
```

## Apps that only start local servers (npx)

```json
{ "mcpServers": { "cafe-mcp": { "command": "npx", "args": ["-y", "@dangamsoft/cafe-mcp"], "env": { "CAFE_MCP_KEY": "mcp_live_..." } } } }
```

The npm package is a bridge: it forwards each request to the server above and calculates nothing on your machine.
Before you add a key it lists two tools: `cafe_mcp_sample` (engine results for tricky births computed in advance)
and `cafe_mcp_setup` (how to get a key).

## First question to try

> Show my Saju chart. Born 1990-01-15 10:30, male.

Then ask about the current ten-year luck cycle, or which day pillars fall in a month you care about.

---
한국어 요약: 로그인 되는 앱(claude.ai·ChatGPT)은 주소만 넣고 로그인, 키를 받는 앱은 24plus.ai.kr/my 에서 키를 만들어 넣고,
로컬(npx)만 되는 앱은 `npx -y @dangamsoft/cafe-mcp` 에 `CAFE_MCP_KEY` 를 넣어요.
