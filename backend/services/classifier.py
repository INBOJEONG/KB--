"""
문서 자동 분류 서비스
파싱 → Gemma LLM 호출 → 카테고리/태그/요약/키워드 반환
"""
import logging
from services.llm_client import LLMClient
from services.document_parser import DocumentParser

logger = logging.getLogger(__name__)

CATEGORY_MAP = {
    "인사/총무": "인사/총무",
    "개발/기술": "개발/기술",
    "영업/마케팅": "영업/마케팅",
    "재무/회계": "재무/회계",
    "사내규정": "사내규정",
    "일반": "일반",
}


class DocumentClassifier:
    def __init__(self):
        self.llm = LLMClient()
        self.parser = DocumentParser()

    async def classify(self, file_bytes: bytes, filename: str) -> dict:
        text = await self.parser.parse(file_bytes, filename)

        if not text.strip():
            logger.warning("No text extracted from %s", filename)
            return {
                "extracted_text": "",
                "category": "일반",
                "tags": [],
                "summary": "텍스트를 추출할 수 없는 파일입니다.",
                "keywords": [],
                "title_suggestion": filename,
            }

        classification = await self.llm.classify_document(text)

        category = classification.get("category", "일반")
        if category not in CATEGORY_MAP:
            category = "일반"

        return {
            "extracted_text": text,
            "category": CATEGORY_MAP[category],
            "tags": classification.get("tags", [])[:5],
            "summary": classification.get("summary", ""),
            "keywords": classification.get("keywords", [])[:5],
            "title_suggestion": classification.get("title_suggestion", filename),
        }
