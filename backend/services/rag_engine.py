"""
RAG 검색 엔진
질문 → 임베딩 → 벡터 검색 → 컨텍스트 조합 → LLM 답변
"""
import logging
from services.embedder import EmbeddingService
from services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class RAGEngine:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.llm = LLMClient()

    async def search(self, query: str, top_k: int = 5) -> dict:
        results = self.embedder.search(query, top_k=top_k)

        if not results["documents"] or not results["documents"][0]:
            return {
                "query": query,
                "answer": f'"{query}"에 대한 관련 자료를 Knowledge Base에서 찾지 못했습니다.\n\n다음을 시도해보세요:\n- 다른 키워드로 검색\n- 관련 문서를 먼저 업로드\n- 카테고리별로 문서 목록을 확인',
                "sources": [],
            }

        context_chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            context_chunks.append({
                "text": doc,
                "title": meta.get("title", ""),
                "doc_id": meta.get("doc_id", ""),
                "score": round(1 - dist, 4),
            })

        answer = await self.llm.generate_rag_answer(query, context_chunks)

        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "doc_id": c["doc_id"],
                    "title": c["title"],
                    "chunk": c["text"][:200],
                    "score": c["score"],
                }
                for c in context_chunks
            ],
        }

    def index_document(self, doc_id: str, title: str, chunks: list[str]):
        self.embedder.add_chunks(doc_id, title, chunks)

    def delete_document(self, doc_id: str):
        self.embedder.delete_document(doc_id)
