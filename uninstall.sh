#!/usr/bin/env bash
#
# KnowledgeHub 삭제 스크립트
# 사용법: sudo bash uninstall.sh
#
set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}  ◆ KnowledgeHub 삭제${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}${BOLD}주의: 이 작업은 되돌릴 수 없습니다.${NC}"
echo ""
echo "  다음 항목이 삭제됩니다:"
echo "  - 모든 Docker 컨테이너"
echo "  - 모든 Docker 볼륨 (DB, 파일, 벡터, 모델 데이터)"
echo ""
read -p "  정말 삭제하시겠습니까? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
  echo ""
  echo "  삭제를 취소했습니다."
  echo ""
  exit 0
fi

echo ""

# 서비스 중지 및 볼륨 삭제
echo -e "${RED}[1/2]${NC} 서비스 중지 및 볼륨 삭제..."
docker compose down -v 2>/dev/null || true

echo -e "${RED}[2/2]${NC} Docker 이미지 삭제..."
docker compose config --images 2>/dev/null | while IFS= read -r img; do
  docker rmi "$img" 2>/dev/null || true
done

echo ""
echo -e "${YELLOW}삭제 완료.${NC}"
echo ""
echo "  프로젝트 디렉토리는 그대로 남아 있습니다: ${SCRIPT_DIR}"
echo "  디렉토리까지 삭제하려면: rm -rf ${SCRIPT_DIR}"
echo ""
