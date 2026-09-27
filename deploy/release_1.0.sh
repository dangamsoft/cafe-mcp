#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  cafe-mcp 1.0.0 운영 반영 (Git Bash, 로컬 PC에서 실행)
#  사용법:  bash /c/Project/cafe-mcp/deploy/release_1.0.sh
#
#  단계마다 y/N 확인. N 이면 그 단계만 건너뜀. 실패하면 즉시 중단.
#   1) 엔진 패치  (절기 시각·월주·년주)  → cafe-svr 엔진 폴더, 서버 백업 후 덮어쓰기
#   2) 백엔드 try_handler.py 한 파일 + 재시작 (엔진 패치도 이때 읽힘). 나머지 백엔드는 검증 후 별도
#   3) npm 배포 @dangamsoft/cafe-mcp 1.0.0 + git 커밋·태그·푸시
#   4) 원격 MCP 서버 (/opt/cafe-mcp, systemd cafe-mcp-http, nginx, certbot)
#   5) 웹 배포 (24plus-web/deploy-rsync.sh prod). 웹 전체가 나가므로 검증 전이면 N
#   6) 최종 확인 (공개 주소로 health + tools/list)
#
#  사전 조건: mcp.24plus.ai.kr A 레코드 → cafe-svr 공인 IP (4단계 certbot 전에 필요)
# ═══════════════════════════════════════════════════════════════
set -e
SSH_HOST="cafe-svr"
DOMAIN="mcp.24plus.ai.kr"
MCP_DIR="/c/Project/cafe-mcp"
VERSION=$(cd "$MCP_DIR" && node -p "require('./package.json').version")   # package.json 기준
ENGINE_SRC="/c/Project/d25engine/src"
BE_DIR="/c/Project/d25mcp_api"
WEB_DIR="/c/Project/24plus-web"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

ask() { read -r -p "$(echo -e "${YELLOW}$1 [y/N] ${NC}")" a; [ "$a" = "y" ] || [ "$a" = "Y" ]; }
ok()  { echo -e "${GREEN}✓ $1${NC}"; }
die() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "${YELLOW}== cafe-mcp ${VERSION} 운영 반영 ==${NC}"
ssh -o ConnectTimeout=8 "$SSH_HOST" true || die "$SSH_HOST 접속 실패"
ok "$SSH_HOST 접속"

# ── 1) 엔진 패치 ──
if ask "[1/6] 엔진 패치 (func_life_acty_calendar.py) 올릴까요?"; then
  ENGINE_PATH=$(ssh "$SSH_HOST" "grep -h '^CAFE_ENGINE_PATH=' /var/www/d25mcp_api/.env /var/www/d25mcp_api/.env.prod 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r\"'")
  [ -n "$ENGINE_PATH" ] || die "서버 .env 에서 CAFE_ENGINE_PATH 를 못 찾음"
  F="cafe_insight/functions/func_life_acty_calendar.py"
  ssh "$SSH_HOST" "test -f '$ENGINE_PATH/$F'" || die "서버에 $ENGINE_PATH/$F 없음 (경로 확인)"
  echo "  엔진 경로: $ENGINE_PATH"
  ssh "$SSH_HOST" "cp '$ENGINE_PATH/$F' '$ENGINE_PATH/$F.bak_20260926_jeolgi'"
  scp -q "$ENGINE_SRC/$F" "$SSH_HOST:$ENGINE_PATH/$F"
  ssh "$SSH_HOST" "grep -q '절기시간' '$ENGINE_PATH/$F'" || die "엔진 파일 전송 확인 실패"
  ok "엔진 패치 (서버 백업: $F.bak_20260926_jeolgi, 재시작은 2단계에서)"
fi

# ── 2) 백엔드: MCP에 필요한 파일 하나만 (handlers/try_handler.py, 달력 달 이동 xl_value) ──
#   나머지 백엔드 수정(chat_v2 등)은 검증 후 따로 deploy.sh prod 로.
if ask "[2/6] 백엔드 try_handler.py 한 파일만 올리고 재시작할까요?"; then
  BF="handlers/try_handler.py"; RP="/var/www/d25mcp_api/$BF"
  ssh "$SSH_HOST" "cat '$RP'" > /tmp/try_handler.prod.py || die "운영 $BF 읽기 실패"
  echo "  운영 대비 로컬 차이:"
  diff /tmp/try_handler.prod.py "$BE_DIR/$BF" | sed 's/^/    /' || true
  ask "  위 차이가 xl_value(달력 달 이동) 관련뿐인가요? 올릴까요?" || die "중단: 차이 확인 필요"
  ssh "$SSH_HOST" "cp '$RP' '$RP.bak_20260927_mcp'"
  scp -q "$BE_DIR/$BF" "$SSH_HOST:$RP"
  ssh "$SSH_HOST" "systemctl restart d25mcp-api"
  sleep 8
  ssh "$SSH_HOST" "curl -s -m 10 localhost:9000/health | head -c 200" | grep -q "environment" && ok "백엔드 재시작 (백업: $BF.bak_20260927_mcp)" \
    || die "백엔드 health 실패. 복구: ssh $SSH_HOST \"cp $RP.bak_20260927_mcp $RP && systemctl restart d25mcp-api\""
  CAL=$(curl -s -m 30 -X POST https://24plus.ai.kr/api/try/panels -H 'content-type: application/json' \
        -d '{"preset":"calendar","birth":"200001011200","gender":1,"xl_value":"202702"}')
  echo "$CAL" | grep -q '2027-02-04' && echo "$CAL" | grep -q '입춘' && ok "운영 달력: 2027-02 달 이동 + 입춘 확인" \
    || echo -e "${RED}⚠ 운영 달력 확인 실패 (달 이동 또는 절기 없음). 엔진 경로·재시작 확인 필요${NC}"
fi

# ── 3) npm + git ──
if ask "[3/6] npm 배포 @dangamsoft/cafe-mcp@${VERSION} + git 태그 할까요?"; then
  cd "$MCP_DIR"
  grep -q "\"version\": \"${VERSION}\"" package.json || die "package.json 버전이 ${VERSION} 아님"
  npm test
  npm whoami >/dev/null 2>&1 || die "npm 로그인 필요: npm login 후 다시 실행"
  if [ -n "$(npm view "@dangamsoft/cafe-mcp@${VERSION}" version 2>/dev/null)" ]; then
    echo "  이미 배포된 버전 → publish 생략"
  else
    npm publish --access public
  fi
  ok "npm ${VERSION}"
  git add -A
  git commit -m "release: v${VERSION}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TbnYWzvGrN1yjx4menkfjr" || echo "  커밋할 변경 없음"
  git tag -f "v${VERSION}"
  git push origin HEAD "v${VERSION}"
  ok "git 태그 v${VERSION} 푸시 (레지스트리 자동 등록)"
fi

# ── 4) 원격 MCP 서버 ──
if ask "[4/6] 원격 MCP 서버(${DOMAIN}) 설치할까요?"; then
  NODE_BIN=$(ssh "$SSH_HOST" 'bash -lc "command -v node"')
  NODE_VER=$(ssh "$SSH_HOST" "$NODE_BIN -v")
  echo "  node: $NODE_BIN ($NODE_VER)"
  case "$NODE_VER" in v1[89]*|v2*) ;; *) die "서버 Node 18 이상 필요 ($NODE_VER)";; esac
  NPM_BIN="$(dirname "$NODE_BIN")/npm"
  # npm 게시 직후엔 레지스트리 반영이 몇 분 늦을 수 있다: 최대 5분 대기
  for i in $(seq 1 30); do
    [ "$(curl -s -m 10 https://registry.npmjs.org/@dangamsoft%2fcafe-mcp/${VERSION} | grep -o '"version":"[^"]*"' | head -1)" = "\"version\":\"${VERSION}\"" ] && break
    [ "$i" = 1 ] && echo "  npm 레지스트리에 ${VERSION} 반영 대기 중..."
    sleep 10
  done

  ssh "$SSH_HOST" "mkdir -p /opt/cafe-mcp && cd /opt/cafe-mcp && PATH=$(dirname "$NODE_BIN"):\$PATH $NPM_BIN install --prefer-online --registry=https://registry.npmjs.org/ --omit=dev --no-audit --no-fund @dangamsoft/cafe-mcp@${VERSION} >/dev/null"
  ssh "$SSH_HOST" "test -f /opt/cafe-mcp/node_modules/@dangamsoft/cafe-mcp/http.js" || die "npm 설치 실패"

  # systemd: 실제 node 경로로 서비스 파일 생성 (node 가 /root 아래면 ProtectHome 끔)
  # node 가 /root 아래(nvm 등)면 격리 사용자로는 못 읽으므로 root 로 실행
  PROTECT="ProtectHome=yes"; DYN="DynamicUser=yes"
  case "$NODE_BIN" in /root/*) PROTECT="ProtectHome=no"; DYN="DynamicUser=no"; echo "  node 가 /root 아래라 root 로 실행";; esac
  sed -e "s#__NODE__#${NODE_BIN}#" -e "s#^ProtectHome=yes#${PROTECT}#" -e "s#^DynamicUser=yes#${DYN}#" "$MCP_DIR/deploy/cafe-mcp-http.service" \
    | ssh "$SSH_HOST" "cat > /etc/systemd/system/cafe-mcp-http.service"
  ssh "$SSH_HOST" "touch /var/log/cafe-mcp-http.log && systemctl daemon-reload && systemctl enable --now cafe-mcp-http && systemctl restart cafe-mcp-http"
  sleep 2
  ssh "$SSH_HOST" "curl -s localhost:8787/health" | grep -q "\"version\":\"${VERSION}\"" || die "로컬 health 실패: ssh $SSH_HOST 'journalctl -u cafe-mcp-http -n 30 --no-pager'"
  ok "cafe-mcp-http 가동 (127.0.0.1:8787)"

  # nginx: 이미 TLS 가 붙은 설정이면 건드리지 않는다 (덮어쓰면 certbot 이 넣은 ssl 줄이 사라짐)
  if ssh "$SSH_HOST" "grep -qs ssl_certificate /etc/nginx/sites-available/${DOMAIN} /etc/nginx/conf.d/${DOMAIN}.conf"; then
    echo "  nginx: 기존 설정(TLS 포함) 유지"
  elif ssh "$SSH_HOST" "test -d /etc/nginx/sites-available"; then
    scp -q "$MCP_DIR/deploy/nginx-mcp.conf" "$SSH_HOST:/etc/nginx/sites-available/${DOMAIN}"
    ssh "$SSH_HOST" "ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}"
  else
    scp -q "$MCP_DIR/deploy/nginx-mcp.conf" "$SSH_HOST:/etc/nginx/conf.d/${DOMAIN}.conf"
  fi
  ssh "$SSH_HOST" "nginx -t && systemctl reload nginx" || die "nginx 설정 오류"
  ok "nginx"

  # DNS + TLS
  RESOLVED=$(ssh "$SSH_HOST" "getent hosts ${DOMAIN} | awk '{print \$1}' | head -1")
  [ -n "$RESOLVED" ] || die "DNS 미등록: ${DOMAIN} A 레코드를 먼저 등록하고 4단계를 다시 실행"
  echo "  DNS: $DOMAIN → $RESOLVED"
  if ssh "$SSH_HOST" "test -d /etc/letsencrypt/live/${DOMAIN}"; then
    echo "  인증서 이미 있음"
  else
    ssh "$SSH_HOST" "certbot --nginx -d ${DOMAIN} --non-interactive --redirect" || die "certbot 실패 (DNS 전파 대기 후 재시도)"
  fi
  ok "TLS"
fi

# ── 5) 웹 ──
if ask "[5/6] 웹 배포 (웹 전체 반영, 검증 전이면 N) 할까요?"; then
  (cd "$WEB_DIR" && ./deploy-rsync.sh prod)
fi

# ── 6) 최종 확인 ──
echo -e "${YELLOW}[6/6] 공개 주소 확인${NC}"
curl -s -m 10 "https://${DOMAIN}/health" | grep -q "\"version\":\"${VERSION}\"" && ok "https://${DOMAIN}/health" || echo -e "${RED}⚠ health 실패${NC}"
TOOLS=$(curl -s -m 20 -X POST "https://${DOMAIN}/mcp" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"release-check","version":"0"}}}')
echo "$TOOLS" | grep -q '"serverInfo"' && ok "MCP initialize 응답" || echo -e "${RED}⚠ MCP initialize 실패: $TOOLS${NC}"
LIST=$(curl -s -m 20 -X POST "https://${DOMAIN}/mcp" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')
N=$(echo "$LIST" | grep -o '"name":"[a-z_]*"' | sort -u | wc -l)
[ "$N" -ge 6 ] && ok "tools/list: ${N}개" || echo -e "${RED}⚠ tools/list 이상: $LIST${NC}"
echo -e "${GREEN}끝. claude.ai 설정 → 커넥터 → 커스텀 커넥터 추가 → https://${DOMAIN}/mcp${NC}"
