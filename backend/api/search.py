"""
AI 검색 API (RAG)
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.search_log import SearchLog
from services.rag_engine import RAGEngine

router = APIRouter(prefix="/api/search", tags=["search"])
rag = RAGEngine()


class SearchRequest(BaseModel):
    query: str


@router.post("")
async def ai_search(body: SearchRequest, db: AsyncSession = Depends(get_db)):
    result = await rag.search(body.query)

    log = SearchLog(
        query=body.query,
        result_ids=[s["doc_id"] for s in result["sources"]],
        response=result["answer"],
    )
    db.add(log)
    await db.commit()

    return result


@router.get("/history")
async def search_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    query = select(SearchLog).order_by(SearchLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "query": log.query,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
