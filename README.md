# cafe-mcp

> **CAFE = Cross-weighted Analysis of the Five Elements**
>
> Public OWL ontology for Korean Saju (사주명리학),
> with planned MCP integration via the CAFE engine.

[![MCP](https://img.shields.io/badge/MCP-planned-blue.svg)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![W3C OWL 2](https://img.shields.io/badge/W3C-OWL%202-orange.svg)](https://www.w3.org/TR/owl2-overview/)
[![Ontology](https://img.shields.io/badge/Ontology-1%2C711%20triples-brightgreen.svg)](./ontology/)
[![Version](https://img.shields.io/badge/Version-0.6.0-green.svg)](#)

> ✅ **v0.6.0** — The MCP server is live. A local (stdio) server exposing
> **5 free birth-chart tools** — `saju_chart`, `ohaeng_balance`, `gyeokguk`,
> `eumyang_johu`, `yongshin_candidates` — alongside the public W3C OWL
> ontology. See **[Install](#install-mcp-server)** below.

---

## What this is

A formal W3C OWL 2 ontology for Korean Saju (사주명리학), grounded in
classical Myeongli theory and six canonical treatises. Released under
CC BY 4.0 for academic use, system integration, and downstream development.

The ontology is the public layer of the **CAFE engine** — a deterministic
Saju analysis system combining classical theory with ML-based yongshin
classification.

W3C OWL 2 온톨로지 형태로 공개된 한국 사주명리학 도메인 모델입니다.
6대 고전(적천수·자평진전·난강망·궁통보감·연해자평·삼명통회)에 근거하며,
CC BY 4.0으로 학술·시스템 통합·후속 개발에 자유롭게 사용할 수 있습니다.

이 온톨로지는 **CAFE 엔진**의 공개 레이어입니다 — 결정적(deterministic)
사주 분석 시스템으로, 명리학 고전 이론과 ML 기반 용신 분류를 결합합니다.

---

## Install (MCP server)

The server runs locally over stdio and talks to the hosted CAFE backend —
**no API key, no local engine, no database** required.

**Claude Desktop** — add to `claude_desktop_config.json`:

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

**Cursor** — add the same `mcpServers` entry to `~/.cursor/mcp.json`.

Then ask, e.g. *"Show my saju for 1990-01-15 10:30, male."*

### Tools (5, free)

| Tool | Returns |
|------|---------|
| `saju_chart` | Four Pillars chart — stems/branches, Ten Gods, Spirit Stars |
| `ohaeng_balance` | Five Elements (五行) distribution |
| `gyeokguk` | Chart structure/pattern (格局) |
| `eumyang_johu` | Yin-Yang & Climate (陰陽·調候) balance |
| `yongshin_candidates` | Classical 5-type Yongshin (用神) candidates |

All tools take `birth` (`YYYYMMDDHHMM`) and `gender` (0 = female, 1 = male);
`name` and `is_lunar` are optional.

> The AI-selected final Yongshin (91.1%-accuracy classifier), full Yongshin
> report, NCODE personality profile and AI naming are part of the paid
> 24Plus service and are **not** exposed here.

**Custom backend:** set `CAFE_MCP_API_URL` (the server POSTs to
`${CAFE_MCP_API_URL}/try/panels`; default `https://24plus.ai.kr/api`).

---

## Ontology

- **1,711 RDF triples** · SPARQL-queryable · W3C OWL 2 conformant
- Models:
  - 60갑자 (Sexagenary cycle)
  - 75 sinsal (special-star annotations)
  - **18 patterns** — 정격 10 + 특수격 8
  - 5 yongshin types — 격국·억부·병약·조후·통관
  - 12 life stages (12운성)
- Grounded in 6 classical treatises:
  - 적천수 (Diqianshui)
  - 자평진전 (Zipingzhenquan)
  - 난강망 (Lanjiangwang)
  - 궁통보감 (Qiongtongbaojian)
  - 연해자평 (Yuanhaiziping)
  - 삼명통회 (Sanmingtonghui)

See [`ontology/`](./ontology/) for module structure, SPARQL examples, and
the integrated turtle file (`cafe-ontology.ttl`).

---

## CAFE engine performance

The CAFE engine — the inference system this ontology models — operates
inside the 24Plus platform. Validated performance on 5-class yongshin
classification (목/화/토/금/수, 5-fold cross-validated):

| Metric                  | Result   |
|-------------------------|----------|
| Accuracy                | 91.10%   |
| F1-Score (Macro)        | 91.08%   |
| Precision (Macro)       | 91.16%   |
| Recall (Macro)          | 91.10%   |
| ROC AUC (Macro)         | 97.76%   |

Random baseline = 20% (5 classes). 4.56× better than random. ML ensemble
with weighted voting and probability calibration.

The engine itself remains proprietary; the ontology models the domain
structure it operates on.

---

## Roadmap

- **v0.5.x** — Public ontology + name reservation
- **v0.6.0** — Local (stdio) MCP server with 5 free tools *(current)*
- **v0.7+** — Hosted/remote server with OAuth + paid tiers (AI-selected
  yongshin, full report, NCODE), multi-language explanation layers

---

## Note on East Asian Myeongli traditions

This MCP focuses on the Korean Myeongli (사주명리학) tradition, which
shares its classical roots — 子平眞詮 (Zipingzhenquan), 滴天髓 (Diqianshui),
窮通寶鑑 (Qiongtongbaojian), 淵海子平 (Yuanhaiziping), 三命通會 (Sanmingtonghui),
欄江網 (Lanjiangwang) — with the Chinese Bazi (八字) tradition.

Romanization uses Korean Revised Romanization (e.g., Yongshin, Sinsal).
Hanja (정자) is preserved throughout the ontology.

본 MCP는 한국 명리학(사주명리학) 전통에 기반하며, 중국 八字 전통과
6대 고전(자평진전·적천수·궁통보감·연해자평·삼명통회·난강망)을 공유합니다.

---

## Documentation

- 📖 [Ontology specification](./ontology/) — formal OWL ontology with SPARQL examples

---

## Built by

[Dangamsoft (단감소프트)](https://24plus.ai.kr) — Korean AI company
specializing in classical East Asian knowledge systems.

🌐 https://24plus.ai.kr

---

## License

- **Code** (when published in v0.6.0): Apache 2.0
- **Public OWL ontology** ([`ontology/`](./ontology/)): CC BY 4.0

The CAFE inference engine, scoring algorithms, ML model weights, and
interpretation templates remain proprietary.
