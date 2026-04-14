"""
파일 업로드 API
파일 수신 → MinIO 저장 → 백그라운드로 분류/인덱싱
"""
import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.document import Document
from models.category import Category
from models.tag import Tag
from services.classifier import DocumentClassifier
from services.file_storage import FileStorage
from services.chunker import TextChunker
from services.rag_engine import RAGEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["upload"])

classifier = DocumentClassifier()
storage = FileStorage()
chunker = TextChunker(chunk_size=800, chunk_overlap=200)
rag = RAGEngine()


async def _process_document(doc_id: str, file_bytes: bytes, filename: str):
    """백그라운드 태스크: 문서 분류 및 벡터 인덱싱"""
    from database import async_session

    try:
        result = await classifier.classify(file_bytes, filename)

        async with async_session() as session:
            doc = await session.get(Document, doc_id)
            if not doc:
                return

            # 카테고리 매핑
            cat_result = await session.execute(
                select(Category).where(Category.name == result["category"])
            )
            category = cat_result.scalar_one_or_none()
            if category:
                doc.category_id = category.id

            # 태그 처리
            for tag_name in result["tags"]:
                tag_result = await session.execute(
                    select(Tag).where(Tag.name == tag_name)
                )
                tag = tag_result.scalar_one_or_none()
                if not tag:
                    tag = Tag(name=tag_name)
                    session.add(tag)
                    await session.flush()
                doc.tags.append(tag)

            doc.summary = result["summary"]
            doc.keywords = result["keywords"]
            if result["title_suggestion"] and result["title_suggestion"] != filename:
                doc.title = result["title_suggestion"]

            # 청크 분할 및 벡터 인덱싱
            chunks = chunker.split(result["extracted_text"])
            if chunks:
                rag.index_document(str(doc.id), doc.title, chunks)

            doc.is_indexed = True
            await session.commit()
            logger.info("Document %s processed successfully", doc_id)

    except Exception as e:
        logger.error("Failed to process document %s: %s", doc_id, e)


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    file_path = storage.upload(file_bytes, file.filename, file.content_type)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    doc = Document(
        title=file.filename,
        file_path=file_path,
        file_name=file.filename,
        file_type=ext,
        file_size=len(file_bytes),
        doc_type="file",
        is_indexed=False,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(_process_document, str(doc.id), file_bytes, file.filename)

    return {
        "id": str(doc.id),
        "title": doc.title,
        "file_name": doc.file_name,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "is_indexed": False,
        "message": "파일이 업로드되었습니다. 백그라운드에서 분류 및 인덱싱이 진행됩니다.",
    }
