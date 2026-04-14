#!/usr/bin/env bash
#
# KnowledgeHub 업데이트 스크립트
# 사용법: cd /opt/KB-- && sudo bash update.sh
#
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}${BOLD}  ◆ KnowledgeHub 업데이트${NC}"
echo ""

# 1. 최신 코드 가져오기
info "최신 코드 가져오는 중..."
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  log "이미 최신 상태입니다."
  echo ""
  exit 0
fi

# 변경 사항 요약
echo ""
info "변경 사항:"
git log --oneline "${BEFORE}..${AFTER}" | while IFS= read -r line; do
  echo -e "  - ${line}"
done
echo ""

# 2. 서비스 재빌드
info "변경된 서비스 재빌드 중..."
docker compose up -d --build 2>&1 | while IFS= read -r line; do
  echo -e "  ${line}"
done

echo ""

# 3. 상태 확인
info "서비스 상태:"
docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker compose ps

echo ""
log "업데이트 완료!"
echo ""
