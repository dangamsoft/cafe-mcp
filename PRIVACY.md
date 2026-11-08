# cafe-mcp privacy policy

Last updated: 2026-11-08. Applies to the remote server at `https://mcp.24plus.ai.kr/mcp` and to the retired
`@dangamsoft/cafe-mcp` npm package (local npx wrapper).
Operator: Dangamsoft (단감소프트), Republic of Korea. Contact: info@dangamsoft.com
Full terms (Korean and English): https://24plus.ai.kr/mcp/terms

## What the server receives

- **Account**: cafe-mcp needs a 24PLUS account. You connect by signing in (OAuth) or with a key you create.
  We handle your email, name and sign-in method to identify you and manage your connections.
- **Tool arguments**: only the arguments of the tool you call, such as birth date and time, sex, calendar
  (solar or lunar), leap-month flag and an optional birthplace ID; or a month, a term or a search text.

We do not receive your conversation with your AI app.

## The local npx wrapper also sends data to 24PLUS

The npm package (`npx @dangamsoft/cafe-mcp`) runs on your machine but does **not** calculate there: it sends the
birth date, time and sex to the 24PLUS server, and the CAFE engine computes the chart. The package is deprecated;
use the remote server above.

## How it is used

The arguments are passed to the CAFE engine (servers in Korea) to compute the result, which is returned to your
AI app. They are not used for anything else, not used to train models, not sold and not shared with third parties.

## What is kept, and for how long

- **Birth data** is not saved to your account or usage records. It may stay briefly in a temporary cache used to
  answer repeated requests faster; that cache is not linked to your account.
- **Usage records**: tool calls per day, this month's chart fingerprints (one-way hashes, used to count the monthly
  chart limit) and fair-use warnings. Deleted after the period needed to prevent abuse.
- **Connections and keys**: app name and connection times. Sign-in tokens and keys are stored only as hashes.
- **Server access logs**: standard logs (IP address, time, path, status code, without request bodies) for security
  and troubleshooting, under routine rotation.

Deleting your 24PLUS account deletes your account details and connections.

## Your choices

- See and disconnect connected apps, and delete keys, in My account > Connected AI.
- Ask about or request deletion of data related to your requests: info@dangamsoft.com.

## Changes

Changes to this policy are published in this file and at https://24plus.ai.kr/mcp/terms with a new date.
