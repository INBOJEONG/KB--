"""
Ollama API Client - Gemma LLM 호출
OpenAI 호환 엔드포인트 사용
"""
import json
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

CLASSIFY_SYSTEM_PROMPT = """당신은 사내 문서 분류 전문가입니다.
다음 문서 내용을 분석하여 아래 JSON 형식으로만 응답해주세요.

카테고리는 다음 중 하나를 선택하세요:
- 인사/총무
- 개발/기술
- 영업/마케팅
- 재무/회계
- 사내규정
- 일반

{
  "category": "카테고리명",
  "tags": ["태그1", "태그2", "태그3"],
  "summary": "문서 요약 (2~3줄)",
  "keywords": ["핵심어1", "핵심어2", "핵심어3", "핵심어4", "핵심어5"],
  "title_suggestion": "추천 제목 (원본 파일명이 불명확한 경우)"
}"""

RAG_SYSTEM_PROMPT = """당신은 사내 Knowledge Base AI 어시스턴트입니다.
다음 참고 문서들을 기반으로 질문에 답변해주세요.

규칙:
1. 반드시 참고 문서 내용에 기반하여 답변하세요.
2. 문서에 없는 내용은 "관련 문서에서 해당 정보를 찾지 못했습니다"라고 답변하세요.
3. 답변 끝에 근거가 된 문서 제목을 [출처: 문서제목] 형식으로 표시하세요.
4. 한국어로 답변하세요."""


class LLMClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def chat(self, messages: list[dict], temperature: float = 0.3) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def classify_document(self, text: str) -> dict:
        truncated = text[:4000]
        messages = [
            {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
            {"role": "user", "content": f"문서 내용:\n---\n{truncated}\n---"},
        ]
        result = await self.chat(messages, temperature=0.1)
        return self._parse_json(result)

    async def generate_rag_answer(self, query: str, context_chunks: list[dict]) -> str:
        context = "\n\n".join(
            f"[참고 문서 {i+1}: {c['title']}]\n{c['text']}"
            for i, c in enumerate(context_chunks)
        )
        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "user", "content": f"{context}\n\n질문: {query}"},
        ]
        return await self.chat(messages, temperature=0.3)

    def _parse_json(self, text: str) -> dict:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            logger.warning("Failed to parse LLM JSON response: %s", text[:200])
        return {
            "category": "일반",
            "tags": [],
            "summary": "",
            "keywords": [],
            "title_suggestion": "",
        }
