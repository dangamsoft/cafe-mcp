# CAFE Ontology

> A formal W3C OWL ontology systematizing classical Korean Saju (사주명리학) theory.
> The CAFE engine's proprietary algorithms and ML ensemble operate on top of this open knowledge layer.

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![W3C OWL 2](https://img.shields.io/badge/W3C-OWL%202-orange.svg)](https://www.w3.org/TR/owl2-overview/)
[![Version](https://img.shields.io/badge/Version-0.5.3-green.svg)](#)

---

## 무엇인가 / What this is

본 온톨로지는 사주명리학 이론을 W3C 표준으로 체계화한 **공개 지식 레이어**입니다. 단감소프트의 내부 알고리즘과 ML 앙상블은 이 위에서 작동합니다.

A formal W3C OWL ontology systematizing classical Korean Saju (사주명리학) theory. The CAFE engine's proprietary algorithms and ML ensemble operate on top of this open knowledge layer.

```
[공개 - This Repo]
순수 명리학 이론의 체계적 온톨로지
  ├ 천간/지지/오행/음양 + 60갑자
  ├ 합/충/형/파/해 (관계)
  ├ 십신 + 12운성
  ├ 신살 75종
  ├ 격국 18종 + 용신 5종
  └ 6대 고전 매핑

       ↓ 위에 구축됨

[비공개 - Proprietary]
- CAFE 규칙 엔진
- ML ensemble (91.10% accuracy)
- SHAP 설명가능성
- 교차 검증 시스템
```

---

## 통계 / Statistics

| Item                    | Count |
|-------------------------|-------|
| Triples                 | 1,711 |
| Pillars (60갑자)         | 60    |
| Heavenly Stems (천간)    | 10    |
| Earthly Branches (지지)  | 12    |
| Five Elements (오행)     | 5     |
| Ten Gods (십신)          | 10    |
| Life Stages (12운성)     | 12    |
| Combinations (합)        | 19    |
| **Sinsal (신살)**        | **75** |
| **Patterns (격국)**      | **18** |
| **Yongshin (용신)**      | **5** |
| Classical Treatises (고전) | 6  |

---

## 모듈 구조 / Module structure

```
ontology/
├── README.md
├── cafe-ontology.ttl          # 통합본 (모든 모듈 포함, 1,711 triples)
└── modules/
    ├── core.ttl               # 천간/지지/오행/음양 + 60갑자 + 지장간
    ├── relations.ttl          # 합/충/형/파/해
    ├── ten-gods.ttl           # 십신 (10)
    ├── life-stages.ttl        # 12운성
    ├── sinsal.ttl             # 신살 75종 (6 카테고리)
    ├── patterns.ttl           # 격국 18 + 용신 5
    └── treatises.ttl          # 6대 고전 + 이론적 계보
```

각 모듈은 독립적으로 파싱 가능하며, 통합본은 모든 모듈을 하나의 그래프로 묶습니다.

---

## 빠른 시작 / Quick start

```bash
pip install rdflib

python3 -c "
from rdflib import Graph
g = Graph()
g.parse('cafe-ontology.ttl', format='turtle')
print(f'Loaded {len(g)} triples')
"
```

### SPARQL 예시 — 격국 18종

```sparql
PREFIX saju: <https://24plus.ai.kr/ontology/saju#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?parent ?en ?ko WHERE {
  ?p rdfs:subClassOf ?parent .
  ?parent rdfs:subClassOf saju:Pattern .
  ?p rdfs:label ?en . FILTER (lang(?en) = "en")
  ?p rdfs:label ?ko . FILTER (lang(?ko) = "ko")
} ORDER BY ?parent ?p
```

결과: 정격 10 + 특수격 8 = 18 patterns

### SPARQL 예시 — 용신 5종

```sparql
PREFIX saju: <https://24plus.ai.kr/ontology/saju#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?en ?ko WHERE {
  ?y rdfs:subClassOf saju:Yongshin .
  ?y rdfs:label ?en . FILTER (lang(?en) = "en")
  ?y rdfs:label ?ko . FILTER (lang(?ko) = "ko")
}
```

결과:
```
Gyeokguk Yongshin     격국용신(格局用神)
Eokbu Yongshin        억부용신(抑扶用神)
Byeongyak Yongshin    병약용신(病藥用神)
Johu Yongshin         조후용신(調候用神)
Tonggwan Yongshin     통관용신(通關用神)
```

### SPARQL 예시 — 고전과 개념의 이론적 계보

```sparql
SELECT ?concept ?treatise WHERE {
  ?c saju:groundedIn ?t .
  ?c rdfs:label ?concept .
  ?t rdfs:label ?treatise .
  FILTER (lang(?concept) = "ko")
  FILTER (lang(?treatise) = "ko")
}
```

결과 (일부):
```
조후용신(調候用神)  ← 궁통보감(窮通寶鑑)
억부용신(抑扶用神)  ← 적천수(滴天髓)
격국용신(格局用神)  ← 자평진전(子平眞詮)
정관격             ← 자평진전(子平眞詮)
편관격(七殺格)      ← 자평진전(子平眞詮)
정인격             ← 자평진전(子平眞詮)
편인격             ← 자평진전(子平眞詮)
... (정격 10종 모두 자평진전)
```

### SPARQL 예시 — 일주/일간 기준 흉성 신살

```sparql
SELECT ?label WHERE {
  ?s a saju:DayBasedSinsal ;
     saju:hasNature saju:Inauspicious ;
     rdfs:label ?label .
  FILTER (lang(?label) = "ko")
}
```

결과: 동주사, 동주절, 양인살, 원진살, 음양살, 음양차착살, 음인살, 효신살

---

## 영문 라벨 정책 / English Label Policy (Option B)

본 온톨로지는 **음역(Revised Romanization) + 표준 영어**의 혼합 정책을 따릅니다.

This ontology uses a hybrid policy: **Korean transliteration + standardized English**.

- **음역 (Transliteration)**: 한국 고유 명리학 개념 (Yongshin, Sinsal, Gyeokguk, Geopsal 등)
- **표준 영어**: 학계에 정착된 용어 (Heavenly Stem, Earthly Branch, Five Element)
- **의미 설명**: `rdfs:comment`에 영문으로 별도 기술

이 방식은:
- 명리학 고유 개념의 본질을 보존
- 어색한 직역 회피 ("Mediating Yongshin" 같은 비표준 번역 X)
- 외국 개발자가 정확한 한국 명리학 용어를 학습 가능

---

## 포함 내용 / Coverage

### ✅ Included (공개)
- 60갑자 / 10천간 / 12지지 / 5오행 / 십신 10종 / 음양
- 천간합 5쌍, 지지충 6쌍, 육합 6쌍, 삼합 4세트, 방합 4세트
- 12운성 (장생~양)
- **신살 75종** (12신살 12 + 관계성 15 + 형상 4 + 일주/일간 27 + 흉신 4 + 길신 13)
- 신살 길흉 분류 (길/흉/중)
- **격국 18종** (정격 10 + 특수격 8 + 부모 2)
  - 정격 10: 정관/편관/정인/편인/식신/상관/정재/편재/건록/양인격
  - 특수격 8: 종왕/종강/종재/종살/종아/**종세**/**종기**/화기격
- **용신 5종** (격국/억부/병약/조후/통관)
- 6대 고전 (적천수/자평진전/난강망/궁통보감/연해자평/삼명통회)
- 개념 → 고전 매핑 (`saju:groundedIn`)
- 지장간 본기/중기/여기 분류
- 만세력 학파 옵션 (동지/입춘 세수, 야자시/조자시)

### ❌ Not included (비공개 — proprietary)
- 점수 가중치 / 신강신약 판정 알고리즘 / 용신 선택 룰
- 격국 판정 로직 / AI 모델 파라미터
- SHAP 가중치 / 91.10% ensemble weights
- 해석 템플릿

---

## Changelog

### v0.5.3 (2026-05-03)
- **`cafe-ontology.ttl`** 헤더 정합 수정
  - `owl:versionInfo` 갱신: `0.4.0` → `0.5.3`
  - rdfs:comment 중립적 표현으로 정리 (v0.5.1 README cleanup과 일관성 확보)
- ontology/README.md 일부 표현을 메인 README와 통일 (`ML ensemble`)

### v0.5.0 (2026-05-02)
- **격국 17 → 18종 확장**
  - `saju:FollowingMomentumPattern` (종세격) 추가 — 식·재·관 혼합 세력 추종
  - `saju:FollowingChiPattern` (종기격) 추가 — 2개 오행 결합 세력 추종 (금수종, 목화종 등)
- patterns.ttl 중복 블록 제거 (EXTENDED PATTERN SUBCLASSES 섹션)
- 정격 10종 모두에 `saju:groundedIn saju:Jajupyeongjinjeon` 명시적 매핑 추가
- 통합본 트리플: 1,672 → 1,711 (+39)

### v0.4.0
- 격국 17종 (정격 10 + 특수격 6 + 부모 2), 용신 5종 (전왕 빼고 격국용신 추가)
- 옵션 B 라벨 정책 (음역 + 표준 영어)

---

## 라이선스 / License

CC BY 4.0. Free to share and adapt with attribution to Dangamsoft.

본 온톨로지의 스키마와 명리학 공통 지식 인스턴스는 **CC BY 4.0** 라이선스로 배포됩니다.

---

## CAFE 엔진 / About CAFE Engine

CAFE (Cross-weighted Analysis of the Five Elements)는 단감소프트가 개발한 명리학 하이브리드 AI 시스템입니다.

- 6대 고전을 ground-truth corpus로 활용
- ML ensemble: **91.10% accuracy** (5-class yongshin classification)
- F1 91.08% · Precision 91.16% · Recall 91.10% · ROC AUC 97.76%
- SHAP-based explainability with classical theory alignment

본 공개 온톨로지는 **공통 지식 레이어**입니다. CAFE 엔진의 규칙 엔진, ML 앙상블, 교차 검증, SHAP 설명가능성, RAG 해석 시스템은 단감소프트의 독점 자산으로 비공개 유지됩니다.

🌐 https://24plus.ai.kr
