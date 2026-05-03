# Changelog

## v0.5.3 — 2026-05-03

### Fixed
- `ontology/cafe-ontology.ttl` 헤더 정합 수정:
  - `owl:versionInfo`: `0.4.0` → `0.5.3` (패키지 버전과 일치)
  - rdfs:comment 표현 정리

### Changed
- `ontology/README.md`:
  - Version 배지: `0.5.0` → `0.5.3`
  - 다이어그램 표현을 메인 README와 통일 (ML ensemble)
  - Changelog 섹션 정리 + v0.5.3 entry
- 메인 `README.md` Version 배지: `0.5.1` → `0.5.3`

---

## v0.5.2 — 2026-05-02

### Added
- README의 Enterprise tier contact 이메일 명시: **info@dangamsoft.com**

### Confirmed
- Indie 가격: $19/mo
- Free quota: 30회/mo (cafe_analysis paid 기준)
- Enterprise contact: info@dangamsoft.com

---

## v0.5.1 — 2026-05-02

### Changed
- README 표현 정리 — 추상화 및 일부 항목 정리
- `Inference engine` 표현 추상화: `ML ensemble`
- `Calendar engine` 표현 단순화: multi-school options 중심
- `Built by` 섹션 단순화
- ontology/README의 CAFE 엔진 섹션도 동일 기준으로 정리

### Kept
- Performance 표 (91.10% / ROC AUC 97.76% / F1 / Precision / Recall) — 핵심 가치 제안
- `1,711 RDF triples`, `18 patterns`, `5 yongshin`, `75 sinsal` 온톨로지 통계
- Tier별 가격 노출 (Free / Indie $19 / Studio $99 / Business $499 / Enterprise)

---

## v0.5.0 — 2026-05-02

### Added
- **격국 종세격 (從勢格)** — `saju:FollowingMomentumPattern`
  - 식상·재성·관살 세 세력의 혼합 기세에 종(從)하는 격국
- **격국 종기격 (從氣格)** — `saju:FollowingChiPattern`
  - 두 오행이 결합된 큰 세력에 종하는 격국
  - 금수종(金水), 목화종(木火), 화토종(火土) 등
- 정격 10종 모두에 `saju:groundedIn saju:Jajupyeongjinjeon` 매핑 추가
- README에 `cafe_basic` / `cafe_analysis` 도구 명세 추가
- README에 5-tier Pricing 섹션 추가

### Changed
- 격국 분류 17종 → **18종** (정격 10 + 특수격 8 + 부모 2)
- 통합본 트리플 카운트: 1,672 → **1,711** (+39)
- 통합본의 EXTENDED PATTERN SUBCLASSES 중복 블록 제거

### Removed
- patterns.ttl의 중복된 EXTENDED PATTERN SUBCLASSES 섹션
- cafe-ontology.ttl 끝부분의 중복 lineage mapping 블록

### Fixed
- patterns.ttl 모듈 단독 파싱 검증 통과 (163 triples)
- 모든 모듈 단독/통합 파싱 일관성 검증

---

## v0.4.0 — 2026-05-02 (Initial public release)

### Initial public ontology release
- 격국 17종 (정격 10 + 특수격 6 + 부모 2)
- 용신 5종 (격국/억부/병약/조후/통관, 전왕 제외)
- 신살 75종
- 6대 고전 매핑
- 통합본 1,672 triples
- 옵션 B 라벨 정책 (음역 + 표준 영어)
- CC BY 4.0 라이선스
