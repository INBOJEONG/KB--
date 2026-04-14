# KnowledgeHub 설치 가이드

> 서버에서 원클릭 자동 설치부터 수동 설치까지 모든 방법을 안내합니다.

---

## 목차

- [자동 설치 (권장)](#자동-설치-권장)
- [수동 설치](#수동-설치)
  - [1. 사전 요구사항 설치](#1-사전-요구사항-설치)
  - [2. 레포지토리 클론](#2-레포지토리-클론)
  - [3. 환경 변수 설정](#3-환경-변수-설정)
  - [4. 서비스 실행](#4-서비스-실행)
  - [5. LLM 모델 다운로드](#5-llm-모델-다운로드)
  - [6. 접속 확인](#6-접속-확인)
- [업데이트](#업데이트)
- [삭제](#삭제)
- [GPU 설정](#gpu-설정)
- [방화벽 설정](#방화벽-설정)
- [트러블슈팅](#트러블슈팅)

---

## 자동 설치 (권장)

서버에 SSH로 접속한 뒤 아래 명령어 **하나**로 전체 설치가 완료됩니다.

```bash
curl -fsSL https://raw.githubusercontent.com/INBOJEONG/KB--/main/install.sh | sudo bash
```

### 자동 설치 스크립트가 수행하는 작업

| 순서 | 작업 | 상세 |
|------|------|------|
| 1 | 시스템 확인 | OS, CPU, RAM, GPU 감지 |
| 2 | 필수 패키지 | Git, curl 설치 |
| 3 | Docker 설치 | Docker Engine + Compose 플러그인 + NVIDIA Toolkit (GPU 시) |
| 4 | 코드 클론 | `/opt/KB--` 에 레포지토리 클론 |
| 5 | 환경 설정 | `.env` 생성, 비밀번호 자동 생성, GPU/CPU 모드 자동 선택 |
| 6 | 서비스 실행 | `docker compose up -d --build` (6개 서비스) |
| 7 | 모델 다운로드 | Ollama에 LLM 모델 다운로드 |

### 설치 옵션 (환경 변수)

설치 전에 환경 변수로 옵션을 변경할 수 있습니다:

```bash
# 설치 경로 변경 (기본: /opt/KB--)
sudo KB_INSTALL_DIR=/home/user/kb bash install.sh

# LLM 모델 변경 (기본: gemma3:4b)
sudo KB_OLLAMA_MODEL=gemma4:26b-a4b bash install.sh

# 둘 다 변경
sudo KB_INSTALL_DIR=/srv/kb KB_OLLAMA_MODEL=gemma3:12b bash install.sh
```

### 지원 OS

| OS | 버전 | 상태 |
|----|------|------|
| Ubuntu | 20.04 / 22.04 / 24.04 | 지원 |
| Debian | 11 / 12 | 지원 |
| CentOS | 8 / 9 (Stream) | 지원 |
| Rocky Linux | 8 / 9 | 지원 |
| RHEL | 8 / 9 | 지원 |

---

## 수동 설치

자동 설치가 어려운 환경이거나 단계별로 직접 설치하고 싶은 경우 아래 절차를 따르세요.

### 1. 사전 요구사항 설치

#### Ubuntu / Debian

```bash
# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# Git 설치
sudo apt install -y git curl

# Docker 설치
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# Docker Compose 플러그인 설치
sudo apt install -y docker-compose-plugin

# 설치 확인
docker --version          # Docker version 24.0+
docker compose version    # Docker Compose version v2.20+
git --version             # git version 2.x
```

#### CentOS / RHEL / Rocky

```bash
# Git 설치
sudo yum install -y git curl

# Docker 설치
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# Docker Compose 플러그인 설치
sudo yum install -y docker-compose-plugin
```

#### NVIDIA GPU 드라이버 (GPU 사용 시)

```bash
# Ubuntu
sudo apt install -y nvidia-driver-535

# NVIDIA Container Toolkit
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null

sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 확인
nvidia-smi
```

### 2. 레포지토리 클론

```bash
# 설치 경로로 이동
cd /opt

# 클론
sudo git clone https://github.com/INBOJEONG/KB--.git
cd KB--
```

### 3. 환경 변수 설정

```bash
# 템플릿 복사
sudo cp .env.example .env

# 편집
sudo vi .env
```

**반드시 변경해야 할 항목:**

```env
# 데이터베이스 비밀번호 변경
POSTGRES_PASSWORD=여기에_강력한_비밀번호_입력
DATABASE_URL=postgresql+asyncpg://kb:여기에_같은_비밀번호@postgres:5432/knowledgebase

# MinIO 비밀번호 변경
MINIO_SECRET_KEY=여기에_다른_강력한_비밀번호_입력

# JWT 시크릿 키 변경
JWT_SECRET_KEY=여기에_랜덤_문자열_입력
```

**환경에 따라 변경할 항목:**

```env
# GPU 있는 경우 → 큰 모델 사용
OLLAMA_MODEL=gemma4:26b-a4b

# GPU 없는 경우 (기본값) → 작은 모델 사용
OLLAMA_MODEL=gemma3:4b
```

> 랜덤 비밀번호 생성 명령어: `openssl rand -base64 20`

### 4. 서비스 실행

```bash
# GPU 사용 시: docker-compose.yml의 ollama 서비스에 GPU 설정 추가
# (자동 설치 스크립트는 이를 자동으로 처리합니다)

# 전체 서비스 빌드 및 시작
sudo docker compose up -d --build

# 시작 상태 확인
sudo docker compose ps

# 로그 확인 (문제 발생 시)
sudo docker compose logs -f backend
```

### 5. LLM 모델 다운로드

```bash
# Ollama 서버가 준비될 때까지 대기 (약 10~30초)
until curl -sf http://localhost:11434/api/tags; do sleep 3; done

# 모델 다운로드 (.env의 OLLAMA_MODEL과 일치해야 함)
sudo docker compose exec ollama ollama pull gemma3:4b

# 다운로드 확인
sudo docker compose exec ollama ollama list
```

### 6. 접속 확인

```bash
# API 헬스 체크
curl http://localhost:8000/api/health
# → {"status":"ok","service":"knowledge-base-api"}

# 카테고리 목록 확인
curl http://localhost:8000/api/categories
# → [{"id":"...","name":"일반",...}, ...]
```

브라우저에서 접속:

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | `http://서버IP:3000` |
| API 문서 (Swagger) | `http://서버IP:8000/docs` |
| MinIO 콘솔 | `http://서버IP:9001` |

---

## 업데이트

코드가 업데이트되었을 때 서버에 반영하는 방법:

### 자동 업데이트

```bash
cd /opt/KB--
sudo bash update.sh
```

### 수동 업데이트

```bash
cd /opt/KB--

# 최신 코드 가져오기
sudo git pull origin main

# 변경된 서비스 재빌드 및 재시작
sudo docker compose up -d --build

# 상태 확인
sudo docker compose ps
```

---

## 삭제

### 자동 삭제

```bash
cd /opt/KB--
sudo bash uninstall.sh
```

### 수동 삭제

```bash
cd /opt/KB--

# 서비스 중지 + 볼륨 삭제 (DB, 파일, 모델 데이터 모두 삭제됨)
sudo docker compose down -v

# 프로젝트 디렉토리 삭제
cd / && sudo rm -rf /opt/KB--
```

> **주의:** `docker compose down -v`는 모든 데이터를 삭제합니다. 데이터를 보존하려면 `-v` 옵션을 제거하세요.

---

## GPU 설정

### GPU 사용 시 docker-compose.yml 수정

`docker-compose.yml`의 `ollama` 서비스에 아래 설정을 추가합니다:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: kb-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # ↓ 이 블록을 추가
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
```

### GPU 모델 선택 가이드

| GPU VRAM | 권장 모델 | .env 설정 |
|----------|----------|----------|
| 24GB+ | gemma4:26b-a4b (BF16) | `OLLAMA_MODEL=gemma4:26b-a4b` |
| 16GB | gemma4:26b-a4b (BF16) | `OLLAMA_MODEL=gemma4:26b-a4b` |
| 12GB | gemma4:26b-a4b-q8_0 | `OLLAMA_MODEL=gemma4:26b-a4b-q8_0` |
| 8GB | gemma4:26b-a4b-q4_K_M | `OLLAMA_MODEL=gemma4:26b-a4b-q4_K_M` |
| GPU 없음 | gemma3:4b | `OLLAMA_MODEL=gemma3:4b` |

---

## 방화벽 설정

외부에서 서비스에 접근하려면 방화벽 포트를 열어야 합니다.

### UFW (Ubuntu)

```bash
# 프론트엔드
sudo ufw allow 3000/tcp

# 백엔드 API (필요한 경우)
sudo ufw allow 8000/tcp

# 설정 확인
sudo ufw status
```

### firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

> **보안 권고:** 운영 환경에서는 Nginx 리버스 프록시를 사용하여 80/443 포트만 외부에 노출하는 것을 권장합니다. `infra/nginx.conf` 파일을 참고하세요.

---

## 트러블슈팅

### 서비스가 시작되지 않을 때

```bash
# 전체 로그 확인
sudo docker compose logs

# 특정 서비스 로그 확인
sudo docker compose logs backend
sudo docker compose logs ollama
sudo docker compose logs postgres

# 서비스 재시작
sudo docker compose restart backend
```

### "Connection refused" 오류

```bash
# 서비스 상태 확인
sudo docker compose ps

# 포트 사용 여부 확인
sudo ss -tlnp | grep -E '3000|8000|5432|8001|9000|11434'

# Docker 네트워크 확인
sudo docker network ls
```

### 모델 다운로드 실패

```bash
# Ollama 컨테이너 상태 확인
sudo docker compose logs ollama

# 디스크 공간 확인 (모델은 수 GB 필요)
df -h

# 수동 다운로드 재시도
sudo docker compose exec ollama ollama pull gemma3:4b
```

### 메모리 부족 (OOM)

```bash
# 현재 메모리 사용량 확인
free -h

# Docker 컨테이너별 메모리 사용량
sudo docker stats --no-stream

# 작은 모델로 변경
# .env 파일에서: OLLAMA_MODEL=gemma3:4b
sudo docker compose restart backend
```

### 데이터베이스 초기화

```bash
# 주의: 모든 데이터가 삭제됩니다!
sudo docker compose down
sudo docker volume rm kb--_pg_data
sudo docker compose up -d
```

### 전체 초기화 (클린 재설치)

```bash
# 모든 컨테이너, 볼륨, 이미지 삭제
sudo docker compose down -v --rmi all

# 다시 시작
sudo docker compose up -d --build

# 모델 재다운로드
sudo docker compose exec ollama ollama pull gemma3:4b
```
