# KnowledgeHub

> **Gemma 4 26B MoE + RAG Pipeline 기반 사내 Knowledge Base 시스템**
>
> 문서 업로드 → AI 자동 분류 → 자연어 검색 → 답변 생성 | 완전 로컬 / 온프레미스

---

## 목차

- [시스템 개요](#시스템-개요)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
  - [사전 요구사항](#사전-요구사항)
  - [설치 및 실행](#설치-및-실행)
  - [LLM 모델 설정](#llm-모델-설정)
  - [로컬 개발 환경](#로컬-개발-환경)
- [파이프라인 상세](#파이프라인-상세)
  - [문서 업로드 및 자동 분류](#1-문서-업로드-및-자동-분류-파이프라인)
  - [AI 검색 (RAG)](#2-ai-검색-rag-파이프라인)
- [API 문서](#api-문서)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [프론트엔드 화면 구성](#프론트엔드-화면-구성)
- [환경 변수](#환경-변수)
- [하드웨어 요구사항](#하드웨어-요구사항)
- [배포](#배포)
- [라이선스](#라이선스)

---

## 시스템 개요

회사 문서를 업로드하면 **AI가 자동으로 분류 · 요약 · 태깅**하고, 자연어 질문으로 문서를 검색하여 **출처가 포함된 답변을 생성**하는 Knowledge Base 시스템입니다.

모든 구성 요소가 오픈소스이며, **외부 API 호출 없이** 완전한 로컬/온프레미스 환경에서 동작합니다.

### 왜 이 시스템인가?

| 특징 | 설명 |
|------|------|
| **완전 로컬** | 모든 데이터가 사내 서버에만 저장 — 보안 규정 준수 |
| **API 비용 제로** | LLM을 로컬에서 실행하여 사용량 무관 고정 비용 |
| **한국어 최적화** | 140개+ 언어 지원 모델 + 한국어 임베딩 |
| **자동화** | 업로드만 하면 분류 · 요약 · 키워드 · 벡터 인덱싱 자동 완료 |

---

## 핵심 기능

### 문서 업로드 & 자동 분류

- PDF, DOCX, XLSX, PPTX, TXT, CSV, 이미지 등 다양한 파일 형식 지원
- AI가 문서를 분석하여 **카테고리 · 태그 · 요약 · 키워드** 자동 생성
- 드래그 앤 드롭으로 간편 업로드, 업로드 진행률 실시간 표시

### AI 검색 (RAG)

- 자연어 질문으로 사내 문서 검색
- 관련 문서 청크를 컨텍스트로 활용하여 **출처가 포함된 정확한 답변** 생성
- 채팅 형태의 직관적 UI

### 문서 관리

- 문서 작성 / 조회 / 수정 / 삭제 (CRUD)
- 카테고리 · 태그 기반 필터링 및 탐색
- 키워드 통합 검색

### 파일 관리

- 드래그 앤 드롭 파일 업로드
- 파일 다운로드 (Presigned URL)
- 파일 메타데이터 및 분류 상태 확인

---

## 기술 스택

| 계층 | 기술 | 역할 |
|------|------|------|
| **LLM** | Gemma 4 — 26B MoE (A4B) | 문서 분류, 요약, AI 검색 답변 생성 |
| **LLM 서빙** | Ollama | 로컬 LLM API 서버 (OpenAI 호환) |
| **임베딩** | multilingual-e5-large | 문서/질문 벡터 변환 (한국어 최적화) |
| **벡터 DB** | ChromaDB | 벡터 저장 및 코사인 유사도 검색 |
| **백엔드** | FastAPI (Python) | 비동기 REST API 서버 |
| **문서 파싱** | Unstructured + LangChain | 멀티포맷 문서 텍스트 추출 |
| **프론트엔드** | Next.js 16 + Tailwind CSS 4 | 반응형 웹 UI |
| **데이터 패칭** | React Query (TanStack) | 서버 상태 관리 및 캐싱 |
| **메타데이터 DB** | PostgreSQL 16 | 문서 메타데이터, 사용자, 검색 로그 |
| **파일 저장소** | MinIO (S3 호환) | 원본 파일 저장 |
| **컨테이너** | Docker Compose | 전체 서비스 오케스트레이션 |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (브라우저)                       │
│              Next.js 프론트엔드 (:3000)                   │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
    파일 업로드       AI 검색 질문      문서 조회/편집
           │              │              │
           ▼              ▼              ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI 백엔드 (:8000)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Upload   │ │ Search   │ │ Document │ │ Classify  │  │
│  │ Service  │ │ (RAG)    │ │ CRUD     │ │ Service   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
└───────┼────────────┼────────────┼──────────────┼────────┘
        │            │            │              │
        ▼            ▼            ▼              ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │  MinIO   │ │ ChromaDB │ │PostgreSQL│ │ Ollama       │
  │  (파일)  │ │ (벡터DB) │ │ (메타DB) │ │ Gemma4 26B   │
  │  :9000   │ │  :8001   │ │  :5432   │ │ :11434       │
  └──────────┘ └──────────┘ └──────────┘ └──────────────┘
```

---

## 프로젝트 구조

```
KB-시스템/
├── docker-compose.yml              # 전체 서비스 오케스트레이션 (6개 서비스)
├── .env.example                    # 환경 변수 템플릿
├── .gitignore
├── README.md
│
├── backend/                        # FastAPI 백엔드
│   ├── Dockerfile
│   ├── requirements.txt            # Python 의존성
│   ├── main.py                     # FastAPI 엔트리포인트 (CORS, 라이프사이클)
│   ├── config.py                   # pydantic-settings 기반 설정 관리
│   ├── database.py                 # SQLAlchemy async 엔진 및 세션
│   │
│   ├── api/                        # API 라우터
│   │   ├── documents.py            # 문서 CRUD (목록/상세/생성/수정/삭제/다운로드)
│   │   ├── upload.py               # 파일 업로드 + 백그라운드 분류/인덱싱
│   │   ├── search.py               # AI 검색 (RAG) + 검색 이력
│   │   └── categories.py           # 카테고리 · 태그 목록 (문서 수 집계)
│   │
│   ├── services/                   # 비즈니스 로직
│   │   ├── llm_client.py           # Ollama API 클라이언트 (분류/RAG 프롬프트)
│   │   ├── embedder.py             # 임베딩 생성 + ChromaDB 연동
│   │   ├── chunker.py              # 텍스트 청크 분할 (800자, 200 오버랩)
│   │   ├── document_parser.py      # 멀티포맷 문서 파싱 (Unstructured)
│   │   ├── classifier.py           # AI 자동 분류 오케스트레이션
│   │   ├── file_storage.py         # MinIO 파일 업로드/다운로드/삭제
│   │   └── rag_engine.py           # RAG 검색 엔진 (벡터 검색 + LLM 답변)
│   │
│   └── models/                     # SQLAlchemy ORM 모델
│       ├── document.py             # 문서 (UUID PK, 메타데이터, 벡터 인덱싱 상태)
│       ├── category.py             # 카테고리 (6개 기본값 시드)
│       ├── tag.py                  # 태그 + document_tags 다대다
│       ├── user.py                 # 사용자 (역할 기반 권한)
│       └── search_log.py           # AI 검색 로그
│
├── frontend/                       # Next.js 16 프론트엔드
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts              # API 프록시 rewrite (/api → :8000)
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── app/                    # App Router 페이지
│       │   ├── layout.tsx          # 루트 레이아웃 (React Query Provider)
│       │   ├── page.tsx            # 메인 페이지 (문서/파일/AI 탭 통합)
│       │   ├── globals.css         # Tailwind 4 테마 + Pretendard 폰트
│       │   ├── documents/
│       │   │   ├── [id]/page.tsx   # 문서 상세 보기
│       │   │   └── new/page.tsx    # 새 문서 작성
│       │   ├── search/page.tsx     # AI 검색 전용 페이지
│       │   └── files/page.tsx      # 파일 관리 전용 페이지
│       │
│       ├── components/             # React 컴포넌트
│       │   ├── Header.tsx          # 상단바 (통합 검색, AI 토글, 새 문서)
│       │   ├── Sidebar.tsx         # 사이드바 (탭, 카테고리, 태그 필터)
│       │   ├── DocumentList.tsx    # 문서 카드 그리드
│       │   ├── DocumentCard.tsx    # 문서 카드 (카테고리 색상, 태그, 조회수)
│       │   ├── DocumentDetail.tsx  # 문서 상세 (요약, 본문, 첨부파일)
│       │   ├── DocumentEditor.tsx  # 문서 에디터 (카테고리/태그/본문)
│       │   ├── AISearch.tsx        # AI 채팅 UI (질문/답변/참고자료)
│       │   ├── FileManager.tsx     # 파일 관리 (드래그앤드롭, 진행률)
│       │   └── Providers.tsx       # React Query Provider
│       │
│       └── lib/                    # 유틸리티
│           ├── api.ts              # Axios API 클라이언트 (타입 포함)
│           ├── types.ts            # TypeScript 인터페이스
│           └── utils.ts            # 파일 아이콘/크기 포맷
│
└── infra/
    └── nginx.conf                  # 리버스 프록시 설정
```

---

## 시작하기

### 사전 요구사항

| 소프트웨어 | 최소 버전 | 용도 |
|-----------|----------|------|
| Docker Desktop | 24.0+ | 컨테이너 실행 (WSL2 백엔드 권장) |
| Docker Compose | v2.20+ | 서비스 오케스트레이션 |
| Git | 2.40+ | 소스 코드 관리 |

> **GPU (선택사항):** NVIDIA GPU + CUDA 드라이버가 있으면 LLM 추론 속도가 크게 향상됩니다.
> GPU가 없어도 CPU 모드로 동작합니다 (속도 저하 있음).

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/INBOJEONG/KB--.git
cd KB--

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 비밀번호 등을 수정하세요

# 3. 전체 서비스 시작
docker compose up -d

# 4. 서비스 상태 확인
docker compose ps
```

정상 실행 시 다음 포트가 활성화됩니다:

| 서비스 | 포트 | URL |
|--------|------|-----|
| **프론트엔드** | 3000 | http://localhost:3000 |
| **백엔드 API** | 8000 | http://localhost:8000 |
| **API 문서 (Swagger)** | 8000 | http://localhost:8000/docs |
| **MinIO 콘솔** | 9001 | http://localhost:9001 |
| **PostgreSQL** | 5432 | `psql -h localhost -U kb -d knowledgebase` |
| **ChromaDB** | 8001 | http://localhost:8001 |
| **Ollama** | 11434 | http://localhost:11434 |

### LLM 모델 설정

서비스 시작 후 LLM 모델을 다운로드해야 합니다:

```bash
# GPU 있는 경우 (16GB+ VRAM) — 최고 품질
docker compose exec ollama ollama pull gemma4:26b-a4b

# GPU 메모리 부족 시 — 4bit 양자화 (8GB VRAM)
docker compose exec ollama ollama pull gemma4:26b-a4b-q4_K_M

# GPU 없는 경우 (CPU 전용) — 작은 모델 사용
docker compose exec ollama ollama pull gemma3:4b
```

> `.env` 파일의 `OLLAMA_MODEL` 값을 다운로드한 모델 이름과 일치시키세요.

#### 양자화 옵션 비교

| 양자화 | VRAM 필요량 | 품질 | 추천 환경 |
|--------|------------|------|----------|
| BF16 (기본) | ~16GB | 최고 | RTX 4070 Ti Super 이상 |
| Q8_0 (8bit) | ~12GB | 거의 동일 | RTX 3090 |
| Q4_K_M (4bit) | ~8GB | 약간 저하 | RTX 3060 / 4060 |
| gemma3:4b (CPU) | RAM 8GB+ | 보통 | GPU 없는 환경 |

### 로컬 개발 환경

Docker 없이 프론트엔드/백엔드를 개별 실행하여 개발할 수 있습니다:

```bash
# 프론트엔드 개발 서버
cd frontend
npm install
npm run dev
# → http://localhost:3000

# 백엔드 개발 서버 (Python 3.11+ 필요)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

> 로컬 개발 시에도 PostgreSQL, ChromaDB, MinIO, Ollama는 Docker로 실행해야 합니다:
> ```bash
> docker compose up -d postgres chroma minio ollama
> ```

---

## 파이프라인 상세

### 1. 문서 업로드 및 자동 분류 파이프라인

```
파일 업로드 (POST /api/upload)
    │
    ▼
[1] MinIO에 원본 파일 저장
    │
    ▼
[2] PostgreSQL에 문서 레코드 생성 (is_indexed = false)
    │
    ▼
[3] 즉시 응답 반환 (문서 ID)
    │
    ▼  ── 이하 BackgroundTask로 비동기 처리 ──
    │
[4] 문서 파싱 (Unstructured)
    │  - PDF → PyMuPDF + Unstructured
    │  - DOCX → python-docx + Unstructured
    │  - XLSX/CSV → pandas
    │  - PPTX → python-pptx + Unstructured
    │  - 이미지 → Tesseract OCR
    │
    ▼
[5] Gemma 4 자동 분류 호출
    │  → 카테고리 분류 (6개 중 택 1)
    │  → 태그 3~5개 생성
    │  → 요약문 생성 (2~3줄)
    │  → 핵심 키워드 추출
    │
    ▼
[6] 텍스트 청크 분할
    │  - 청크 크기: 800자
    │  - 오버랩: 200자
    │
    ▼
[7] 임베딩 변환 (multilingual-e5-large)
    │  - "passage:" 프리픽스 추가
    │
    ▼
[8] ChromaDB에 벡터 저장
    │
    ▼
[9] PostgreSQL 메타데이터 업데이트 (is_indexed = true)
```

### 2. AI 검색 (RAG) 파이프라인

```
사용자 자연어 질문 (POST /api/search)
    │
    ▼
[1] 질문에 "query:" 프리픽스 추가 후 임베딩 벡터로 변환
    │
    ▼
[2] ChromaDB에서 코사인 유사도 기반 Top-5 청크 검색
    │
    ▼
[3] 검색된 청크 + 질문을 Gemma 4 프롬프트에 주입
    │  - 시스템 프롬프트: "참고 문서 기반으로만 답변"
    │  - 규칙: 문서에 없는 내용은 "찾지 못했습니다" 응답
    │  - 출처 표시: [출처: 문서제목] 형식
    │
    ▼
[4] Gemma 4가 문서 기반 답변 생성
    │
    ▼
[5] 답변 + 참고 문서 (제목, 유사도 점수) 반환
    │
    ▼
[6] 검색 로그 저장 (search_logs 테이블)
```

---

## API 문서

서버 실행 후 http://localhost:8000/docs 에서 Swagger UI로 전체 API를 확인할 수 있습니다.

### 주요 엔드포인트

#### 문서 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/documents` | 문서 목록 (페이지네이션, 필터) |
| `GET` | `/api/documents/{id}` | 문서 상세 조회 (조회수 증가) |
| `POST` | `/api/documents` | 문서 직접 작성 |
| `PUT` | `/api/documents/{id}` | 문서 수정 |
| `DELETE` | `/api/documents/{id}` | 문서 삭제 (DB + 벡터 + 파일) |
| `GET` | `/api/documents/{id}/download` | 원본 파일 다운로드 URL |

#### 파일 업로드

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `POST` | `/api/upload` | 파일 업로드 + 자동 분류/인덱싱 |

#### AI 검색

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `POST` | `/api/search` | RAG 기반 AI 검색 |
| `GET` | `/api/search/history` | 최근 검색 이력 |

#### 카테고리 & 태그

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/categories` | 카테고리 목록 (문서 수 포함) |
| `GET` | `/api/tags` | 태그 목록 |

#### 헬스 체크

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/health` | 서버 상태 확인 |

### 응답 예시

<details>
<summary>POST /api/upload 응답</summary>

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "2026_사업계획서.pdf",
  "file_name": "2026_사업계획서.pdf",
  "file_type": "pdf",
  "file_size": 2457600,
  "is_indexed": false,
  "message": "파일이 업로드되었습니다. 백그라운드에서 분류 및 인덱싱이 진행됩니다."
}
```
</details>

<details>
<summary>POST /api/search 응답</summary>

```json
{
  "query": "연차 신청은 어떻게 하나요?",
  "answer": "연차는 최소 1일 전에 신청해야 하며, 3일 이상 연속 사용 시 팀장 승인이 필요합니다.\n\n[출처: 연차 및 휴가 사용 규정]",
  "sources": [
    {
      "doc_id": "doc-uuid-1",
      "title": "연차 및 휴가 사용 규정",
      "chunk": "연차 휴가 사용에 관한 사내 규정입니다...",
      "score": 0.94
    }
  ]
}
```
</details>

---

## 데이터베이스 스키마

### ERD 요약

```
categories (1) ──── (N) documents (N) ──── (M) tags
                         │
                         │ (1:N)
                         ▼
                    search_logs
```

### 주요 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|----------|
| `documents` | 문서/파일 | id, title, content, summary, category_id, file_*, keywords[], is_indexed, views |
| `categories` | 카테고리 (6개 기본값) | id, name, icon, color, sort_order |
| `tags` | 태그 | id, name |
| `document_tags` | 문서-태그 다대다 | document_id, tag_id |
| `users` | 사용자 | id, name, email, hashed_password, role |
| `search_logs` | AI 검색 로그 | id, query, result_ids[], response, created_at |

### 기본 카테고리

| 카테고리 | 아이콘 | 색상 |
|---------|--------|------|
| 일반 | 📋 | `#5b5fc7` |
| 인사/총무 | 👥 | `#c44569` |
| 개발/기술 | 💻 | `#0ea47a` |
| 영업/마케팅 | 📊 | `#e08b2d` |
| 재무/회계 | 💰 | `#7c5cbf` |
| 사내규정 | 📜 | `#d94452` |

---

## 프론트엔드 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| **메인 (문서 목록)** | `/` | 카드 그리드, 카테고리/태그 필터, 통합 검색, 탭 전환 (문서/파일/AI) |
| **문서 상세** | `/documents/[id]` | 문서 본문, AI 요약, 메타정보, 첨부파일 다운로드 |
| **문서 작성** | `/documents/new` | 제목/카테고리/태그/본문 입력, 저장 |
| **파일 관리** | `/files` | 드래그 앤 드롭 업로드, 파일 목록, 진행률, 삭제 |
| **AI 검색** | `/search` | 채팅 형태 UI, 참고 문서 링크, 유사도 점수 |

### UI 특징

- **Pretendard** 폰트 (한국어 최적화)
- 카테고리별 **컬러 코딩** (카드 상단 색상 바, 배지)
- **애니메이션** 효과 (fade-up, 타이핑 인디케이터)
- **반응형** 카드 그리드 (1~3열 자동 조절)

---

## 환경 변수

`.env.example`을 `.env`로 복사한 후 값을 수정하세요.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `POSTGRES_DB` | `knowledgebase` | PostgreSQL 데이터베이스 이름 |
| `POSTGRES_USER` | `kb` | PostgreSQL 사용자 |
| `POSTGRES_PASSWORD` | — | PostgreSQL 비밀번호 |
| `DATABASE_URL` | — | SQLAlchemy async 연결 문자열 |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama API 서버 주소 |
| `OLLAMA_MODEL` | `gemma3:4b` | 사용할 LLM 모델 이름 |
| `CHROMA_HOST` | `chroma` | ChromaDB 호스트 |
| `CHROMA_PORT` | `8000` | ChromaDB 포트 |
| `MINIO_ENDPOINT` | `minio:9000` | MinIO API 엔드포인트 |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO 접근 키 |
| `MINIO_SECRET_KEY` | — | MinIO 시크릿 키 |
| `MINIO_BUCKET` | `kb-files` | MinIO 버킷 이름 |
| `EMBEDDING_MODEL` | `intfloat/multilingual-e5-large` | 임베딩 모델 |
| `JWT_SECRET_KEY` | — | JWT 서명 키 (프로덕션에서 반드시 변경) |
| `JWT_ALGORITHM` | `HS256` | JWT 알고리즘 |
| `JWT_EXPIRE_MINUTES` | `1440` | JWT 만료 시간 (분) |

---

## 하드웨어 요구사항

### 권장 사양

| 구분 | 최소 사양 | 권장 사양 |
|------|----------|----------|
| **GPU** | RTX 3060 (12GB) | RTX 4070 Ti Super (16GB) 이상 |
| **RAM** | 32GB | 64GB |
| **CPU** | 8코어 | 16코어 이상 |
| **저장공간** | 100GB SSD | 500GB NVMe SSD |
| **OS** | Ubuntu 22.04 / Windows 11 | Ubuntu 24.04 LTS |

### GPU 없이 실행 (CPU Only)

CPU 전용 환경에서도 동작하지만 LLM 추론 속도가 느립니다.
`.env`에서 `OLLAMA_MODEL=gemma3:4b`로 작은 모델을 사용하세요.

### 비용 분석

| 구분 | 자체 서버 | 클라우드 (월) |
|------|----------|-------------|
| GPU 서버 | ~200~400만원 (1회) | $80~135/월 |
| LLM API 비용 | **₩0** | **₩0** |
| 소프트웨어 | **₩0** (전체 오픈소스) | **₩0** |

---

## 배포

### Docker Compose (권장)

```bash
# 프로덕션 빌드 & 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 서비스 중지
docker compose down

# 데이터 포함 완전 삭제
docker compose down -v
```

### 서비스별 접속 정보

- **MinIO 콘솔:** http://localhost:9001 (ID: minioadmin / PW: .env 참조)
- **Swagger API 문서:** http://localhost:8000/docs
- **PostgreSQL:** `psql -h localhost -p 5432 -U kb -d knowledgebase`

### Nginx 리버스 프록시

`infra/nginx.conf`를 사용하여 프론트엔드와 백엔드를 단일 도메인으로 서비스할 수 있습니다:

- `/` → Frontend (`:3000`)
- `/api/` → Backend (`:8000`)

---

## 라이선스

이 프로젝트에서 사용하는 모든 구성 요소는 오픈소스입니다:

| 구성 요소 | 라이선스 |
|----------|---------|
| Gemma 4 | Apache 2.0 |
| Ollama | MIT |
| FastAPI | MIT |
| Next.js | MIT |
| PostgreSQL | PostgreSQL License |
| ChromaDB | Apache 2.0 |
| MinIO | AGPL-3.0 |
| multilingual-e5-large | MIT |
