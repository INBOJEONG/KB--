#!/usr/bin/env bash
#
# KnowledgeHub 자동 설치 스크립트
# 사용법: curl -fsSL https://raw.githubusercontent.com/INBOJEONG/KB--/main/install.sh | bash
#    또는: chmod +x install.sh && ./install.sh
#
set -euo pipefail

# ── 색상 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── 설정 ──
REPO_URL="https://github.com/INBOJEONG/KB--.git"
INSTALL_DIR="${KB_INSTALL_DIR:-/opt/KB--}"
OLLAMA_MODEL="${KB_OLLAMA_MODEL:-gemma3:4b}"

# ── 유틸 ──
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; }
info()   { echo -e "${BLUE}[i]${NC} $1"; }
header() { echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════${NC}"; echo -e "${CYAN}${BOLD}  $1${NC}"; echo -e "${CYAN}${BOLD}═══════════════════════════════════════${NC}\n"; }

check_root() {
  if [ "$EUID" -ne 0 ]; then
    error "이 스크립트는 root 권한이 필요합니다."
    echo "  sudo bash install.sh"
    exit 1
  fi
}

# ──────────────────────────────────────────
# STEP 1: 시스템 정보 확인
# ──────────────────────────────────────────
detect_os() {
  header "STEP 1/7 — 시스템 정보 확인"

  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID="$ID"
    OS_VERSION="$VERSION_ID"
    info "OS: $PRETTY_NAME"
  else
    error "지원되지 않는 운영체제입니다. (Ubuntu/Debian/CentOS/RHEL 지원)"
    exit 1
  fi

  ARCH=$(uname -m)
  info "아키텍처: $ARCH"

  # GPU 확인
  if command -v nvidia-smi &>/dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || true)
    if [ -n "$GPU_INFO" ]; then
      log "NVIDIA GPU 감지: $GPU_INFO"
      HAS_GPU=true
    else
      warn "nvidia-smi는 있으나 GPU를 감지하지 못했습니다."
      HAS_GPU=false
    fi
  else
    warn "NVIDIA GPU가 감지되지 않았습니다. CPU 모드로 설치합니다."
    HAS_GPU=false
  fi

  # 메모리 확인
  TOTAL_MEM=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo "?")
  info "총 메모리: ${TOTAL_MEM}GB"

  # 디스크 확인
  AVAIL_DISK=$(df -h / | awk 'NR==2{print $4}')
  info "사용 가능 디스크: $AVAIL_DISK"

  echo ""
}

# ──────────────────────────────────────────
# STEP 2: 필수 패키지 설치
# ──────────────────────────────────────────
install_prerequisites() {
  header "STEP 2/7 — 필수 패키지 설치"

  # Git
  if command -v git &>/dev/null; then
    log "Git: $(git --version) — 이미 설치됨"
  else
    info "Git 설치 중..."
    case "$OS_ID" in
      ubuntu|debian) apt-get update -qq && apt-get install -y -qq git ;;
      centos|rhel|rocky|alma) yum install -y -q git ;;
      *) error "패키지 관리자를 확인할 수 없습니다. Git을 수동으로 설치하세요."; exit 1 ;;
    esac
    log "Git 설치 완료"
  fi

  # curl
  if ! command -v curl &>/dev/null; then
    info "curl 설치 중..."
    case "$OS_ID" in
      ubuntu|debian) apt-get install -y -qq curl ;;
      centos|rhel|rocky|alma) yum install -y -q curl ;;
    esac
  fi

  echo ""
}

# ──────────────────────────────────────────
# STEP 3: Docker 설치
# ──────────────────────────────────────────
install_docker() {
  header "STEP 3/7 — Docker 설치"

  if command -v docker &>/dev/null; then
    log "Docker: $(docker --version) — 이미 설치됨"
  else
    info "Docker Engine 설치 중..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    log "Docker 설치 완료"
  fi

  # Docker Compose (v2 plugin)
  if docker compose version &>/dev/null; then
    log "Docker Compose: $(docker compose version --short) — 이미 설치됨"
  else
    info "Docker Compose 플러그인 설치 중..."
    case "$OS_ID" in
      ubuntu|debian) apt-get install -y -qq docker-compose-plugin ;;
      centos|rhel|rocky|alma) yum install -y -q docker-compose-plugin ;;
    esac
    log "Docker Compose 설치 완료"
  fi

  # NVIDIA Container Toolkit (GPU가 있는 경우)
  if [ "$HAS_GPU" = true ]; then
    if dpkg -l 2>/dev/null | grep -q nvidia-container-toolkit || rpm -q nvidia-container-toolkit &>/dev/null; then
      log "NVIDIA Container Toolkit — 이미 설치됨"
    else
      info "NVIDIA Container Toolkit 설치 중..."
      case "$OS_ID" in
        ubuntu|debian)
          curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
          curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
            sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
            tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null
          apt-get update -qq && apt-get install -y -qq nvidia-container-toolkit
          ;;
        centos|rhel|rocky|alma)
          curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | \
            tee /etc/yum.repos.d/nvidia-container-toolkit.repo > /dev/null
          yum install -y -q nvidia-container-toolkit
          ;;
      esac
      nvidia-ctk runtime configure --runtime=docker
      systemctl restart docker
      log "NVIDIA Container Toolkit 설치 완료"
    fi
  fi

  echo ""
}

# ──────────────────────────────────────────
# STEP 4: 레포지토리 클론
# ──────────────────────────────────────────
clone_repo() {
  header "STEP 4/7 — 레포지토리 클론"

  if [ -d "$INSTALL_DIR/.git" ]; then
    info "기존 설치를 감지했습니다. git pull 실행..."
    cd "$INSTALL_DIR"
    git pull origin main
    log "최신 코드로 업데이트 완료"
  else
    info "클론 경로: $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    log "레포지토리 클론 완료"
  fi

  echo ""
}

# ──────────────────────────────────────────
# STEP 5: 환경 변수 설정
# ──────────────────────────────────────────
setup_env() {
  header "STEP 5/7 — 환경 변수 설정"

  cd "$INSTALL_DIR"

  if [ -f .env ]; then
    warn ".env 파일이 이미 존재합니다. 기존 설정을 유지합니다."
    log "기존 .env 사용"
  else
    cp .env.example .env

    # 랜덤 비밀번호 생성
    PG_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    MINIO_SECRET=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)

    # .env 파일에 비밀번호 적용
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASSWORD}|" .env
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql+asyncpg://kb:${PG_PASSWORD}@postgres:5432/knowledgebase|" .env
    sed -i "s|MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=${MINIO_SECRET}|" .env
    sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${JWT_SECRET}|" .env

    # GPU 유무에 따라 모델 설정
    if [ "$HAS_GPU" = true ]; then
      sed -i "s|OLLAMA_MODEL=.*|OLLAMA_MODEL=gemma4:26b-a4b|" .env
      OLLAMA_MODEL="gemma4:26b-a4b"
      log "GPU 감지 → 모델: gemma4:26b-a4b"
    else
      sed -i "s|OLLAMA_MODEL=.*|OLLAMA_MODEL=${OLLAMA_MODEL}|" .env
      log "CPU 모드 → 모델: ${OLLAMA_MODEL}"
    fi

    log ".env 파일 생성 완료 (비밀번호 자동 생성됨)"
    info "생성된 비밀번호는 .env 파일에서 확인할 수 있습니다."
  fi

  # GPU가 있으면 docker-compose에 GPU 블록 추가
  if [ "$HAS_GPU" = true ]; then
    if ! grep -q "capabilities: \[gpu\]" docker-compose.yml; then
      info "docker-compose.yml에 GPU 설정을 추가합니다..."
      sed -i '/container_name: kb-ollama/a\    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: 1\n              capabilities: [gpu]' docker-compose.yml
      log "GPU 설정 추가 완료"
    fi
  fi

  echo ""
}

# ──────────────────────────────────────────
# STEP 6: Docker 서비스 실행
# ──────────────────────────────────────────
start_services() {
  header "STEP 6/7 — Docker 서비스 실행"

  cd "$INSTALL_DIR"

  info "Docker 이미지 빌드 및 서비스 시작 중..."
  info "(첫 실행 시 이미지 다운로드로 5~15분 소요될 수 있습니다)"
  echo ""

  docker compose up -d --build 2>&1 | while IFS= read -r line; do
    echo -e "  ${line}"
  done

  echo ""

  # 서비스 준비 대기
  info "서비스 준비 대기 중..."
  MAX_WAIT=120
  WAITED=0

  # PostgreSQL 준비 대기
  printf "  PostgreSQL "
  until docker compose exec -T postgres pg_isready -U kb -q 2>/dev/null; do
    printf "."
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $WAITED -ge $MAX_WAIT ]; then
      echo ""
      error "PostgreSQL 시작 시간 초과"
      exit 1
    fi
  done
  echo -e " ${GREEN}Ready${NC}"

  # Backend 준비 대기
  WAITED=0
  printf "  Backend    "
  until curl -sf http://localhost:8000/api/health &>/dev/null; do
    printf "."
    sleep 3
    WAITED=$((WAITED + 3))
    if [ $WAITED -ge $MAX_WAIT ]; then
      echo ""
      warn "Backend가 아직 준비되지 않았습니다. 로그를 확인하세요: docker compose logs backend"
      break
    fi
  done
  if [ $WAITED -lt $MAX_WAIT ]; then
    echo -e " ${GREEN}Ready${NC}"
  fi

  echo ""
  log "모든 서비스 시작 완료"
  echo ""

  # 서비스 상태 표시
  docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps

  echo ""
}

# ──────────────────────────────────────────
# STEP 7: LLM 모델 다운로드
# ──────────────────────────────────────────
download_model() {
  header "STEP 7/7 — LLM 모델 다운로드"

  cd "$INSTALL_DIR"

  # Ollama 준비 대기
  info "Ollama 서버 준비 대기 중..."
  WAITED=0
  until curl -sf http://localhost:11434/api/tags &>/dev/null; do
    sleep 3
    WAITED=$((WAITED + 3))
    if [ $WAITED -ge 60 ]; then
      warn "Ollama 서버가 응답하지 않습니다."
      warn "수동으로 모델을 다운로드하세요: docker compose exec ollama ollama pull ${OLLAMA_MODEL}"
      return
    fi
  done

  # 모델이 이미 있는지 확인
  if docker compose exec -T ollama ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
    log "모델 '${OLLAMA_MODEL}' — 이미 다운로드됨"
  else
    info "모델 '${OLLAMA_MODEL}' 다운로드 중..."
    info "(모델 크기에 따라 5~30분 소요될 수 있습니다)"
    echo ""
    docker compose exec -T ollama ollama pull "$OLLAMA_MODEL" 2>&1 | while IFS= read -r line; do
      echo -e "  ${line}"
    done
    echo ""
    log "모델 다운로드 완료"
  fi

  echo ""
}

# ──────────────────────────────────────────
# 설치 완료 요약
# ──────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║         KnowledgeHub 설치가 완료되었습니다!            ║${NC}"
  echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}접속 정보${NC}"
  echo -e "  ─────────────────────────────────────────────"
  echo -e "  프론트엔드        ${GREEN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3000${NC}"
  echo -e "  API 문서 (Swagger) ${GREEN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):8000/docs${NC}"
  echo -e "  MinIO 콘솔        ${GREEN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):9001${NC}"
  echo ""
  echo -e "  ${BOLD}설치 경로${NC}          $INSTALL_DIR"
  echo -e "  ${BOLD}LLM 모델${NC}           $OLLAMA_MODEL"
  echo -e "  ${BOLD}GPU 모드${NC}           $([ "$HAS_GPU" = true ] && echo "활성화" || echo "비활성화 (CPU)")"
  echo ""
  echo -e "  ${BOLD}주요 명령어${NC}"
  echo -e "  ─────────────────────────────────────────────"
  echo -e "  서비스 상태 확인   ${YELLOW}cd $INSTALL_DIR && docker compose ps${NC}"
  echo -e "  로그 확인          ${YELLOW}cd $INSTALL_DIR && docker compose logs -f${NC}"
  echo -e "  서비스 재시작      ${YELLOW}cd $INSTALL_DIR && docker compose restart${NC}"
  echo -e "  서비스 중지        ${YELLOW}cd $INSTALL_DIR && docker compose down${NC}"
  echo -e "  코드 업데이트      ${YELLOW}cd $INSTALL_DIR && git pull && docker compose up -d --build${NC}"
  echo ""
  echo -e "  ${BOLD}환경 설정${NC}           ${YELLOW}$INSTALL_DIR/.env${NC}"
  echo ""
}

# ──────────────────────────────────────────
# 메인
# ──────────────────────────────────────────
main() {
  echo ""
  echo -e "${CYAN}${BOLD}  ◆ KnowledgeHub 자동 설치 스크립트${NC}"
  echo -e "${CYAN}  Gemma 4 26B MoE + RAG 기반 Knowledge Base${NC}"
  echo ""

  check_root
  detect_os
  install_prerequisites
  install_docker
  clone_repo
  setup_env
  start_services
  download_model
  print_summary
}

main "$@"
