#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  cafe-mcp 공개 저장소 올리기 (2026-11-22 CEO 「cafe-mcp 도 자동화 측면에서」)
#    bash /c/Project/cafe-mcp/deploy/publish.sh ["커밋 메시지"]
#
#  실제 서버(mcp.24plus.ai.kr)는 d25mcp_api/mcp_gateway — ./deploy.sh prod 가 올린다. 여기는 공개 쪽만:
#   1) package.json · server.json 버전이 같은지, CHANGELOG 에 그 버전 항목(## x.y.z)이 있는지
#   2) 테스트 (계약 · 요약 · npm 다리)
#   3) 커밋 → GitHub push (main)
#   4) 그 버전 태그(vX.Y.Z)가 아직 없으면 태그 push → GitHub Actions 가 npm 배포(신뢰할 수 있는 게시, 토큰·로그인 없음)
#      + MCP 공식 목록 갱신
#  버전을 안 올렸으면 3)까지만 한다 (문서만 고친 경우).
# ═══════════════════════════════════════════════════════════════
set -e
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; N='\033[0m'
die() { echo -e "${R}✗ $1${N}"; exit 1; }
cd "$(dirname "$0")/.."

V=$(node -p "require('./package.json').version")
SV=$(node -p "require('./server.json').version")
[ "$V" = "$SV" ] || die "package.json $V 와 server.json $SV 버전이 달라요"
grep -q "^## $V" CHANGELOG.md || die "CHANGELOG.md 에 「## $V」 항목이 없어요"
[ "$(git branch --show-current)" = "main" ] || die "main 브랜치에서 실행하세요"

echo -e "${Y}[1/3] 테스트${N}"
node --test test/contract.test.js test/summary.test.js test/bridge.test.js >/tmp/cafe-mcp-test.log 2>&1 || { tail -30 /tmp/cafe-mcp-test.log; die "테스트 실패"; }
echo -e "${G}✓ $(grep -E '^# pass' /tmp/cafe-mcp-test.log)${N}"

echo -e "${Y}[2/3] 커밋 · push${N}"
git add -A
if git diff --cached --quiet; then echo "  바뀐 파일 없음"; else git commit -q -m "${1:-$V}"; fi
git push -q origin main
echo -e "${G}✓ main push${N}"

echo -e "${Y}[3/3] 버전 태그${N}"
if git rev-parse -q --verify "refs/tags/v$V" >/dev/null || git ls-remote --exit-code --tags origin "v$V" >/dev/null 2>&1; then
  echo "  v$V 는 이미 있어요 → npm · MCP 목록은 그대로 (버전을 올리면 다시 나가요)"
else
  # 2026-11-22 npm 은 GitHub Actions 가 「신뢰할 수 있는 게시」(OIDC)로 올린다 — npmjs.com 설정 완료. PC 로그인 필요 없음
  git tag "v$V" && git push -q origin "v$V"
  echo -e "${G}✓ v$V 태그 push → GitHub Actions 가 npm 배포 + MCP 공식 목록 갱신${N}"
  echo "  진행: https://github.com/dangamsoft/cafe-mcp/actions"
fi
