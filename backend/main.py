"""
FastAPI 엔트리포인트
Knowledge Base 백엔드 API 서버
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from database import engine, Base, async_session
from models import Category, Tag, Document, User, SearchLog
from models.category import DEFAULT_CATEGORIES
from api import documents, upload, search, categories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed categories
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    async with async_session() as session:
        result = await session.execute(select(Category).limit(1))
        if not result.scalar_one_or_none():
            for cat_data in DEFAULT_CATEGORIES:
                session.add(Category(**cat_data))
            await session.commit()
            logger.info("Default categories seeded")

    yield

    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Knowledge Base API",
    description="사내 문서 관리 및 AI 검색 시스템",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(upload.router)
app.include_router(search.router)
app.include_router(categories.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "knowledge-base-api"}
