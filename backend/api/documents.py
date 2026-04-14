"""
문서 CRUD API
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from database import get_db
from models.document import Document
from models.category import Category
from models.tag import Tag
from services.file_storage import FileStorage
from services.rag_engine import RAGEngine

router = APIRouter(prefix="/api/documents", tags=["documents"])
storage = FileStorage()
rag = RAGEngine()


class DocumentCreate(BaseModel):
    title: str
    content: str | None = None
    category_id: str | None = None
    tags: list[str] = []
    author: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category_id: str | None = None
    tags: list[str] | None = None
    author: str | None = None


@router.get("")
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: str | None = None,
    tag: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).options(
        selectinload(Document.category),
        selectinload(Document.tags),
    )

    if category_id:
        query = query.where(Document.category_id == uuid.UUID(category_id))
    if tag:
        query = query.join(Document.tags).where(Tag.name == tag)
    if q:
        query = query.where(
            or_(
                Document.title.ilike(f"%{q}%"),
                Document.content.ilike(f"%{q}%"),
                Document.summary.ilike(f"%{q}%"),
            )
        )

    query = query.order_by(Document.updated_at.desc())

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    docs = result.scalars().all()

    return {
        "items": [_serialize_doc(d) for d in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{doc_id}")
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await _get_doc_or_404(db, doc_id)
    doc.views += 1
    await db.commit()
    return _serialize_doc(doc)


@router.post("")
async def create_document(body: DocumentCreate, db: AsyncSession = Depends(get_db)):
    doc = Document(
        title=body.title,
        content=body.content,
        author=body.author,
        doc_type="doc",
        is_indexed=False,
    )

    if body.category_id:
        doc.category_id = uuid.UUID(body.category_id)

    for tag_name in body.tags:
        tag_result = await db.execute(select(Tag).where(Tag.name == tag_name))
        tag = tag_result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            await db.flush()
        doc.tags.append(tag)

    db.add(doc)
    await db.commit()
    await db.refresh(doc, ["category", "tags"])
    return _serialize_doc(doc)


@router.put("/{doc_id}")
async def update_document(
    doc_id: str, body: DocumentUpdate, db: AsyncSession = Depends(get_db)
):
    doc = await _get_doc_or_404(db, doc_id)

    if body.title is not None:
        doc.title = body.title
    if body.content is not None:
        doc.content = body.content
    if body.author is not None:
        doc.author = body.author
    if body.category_id is not None:
        doc.category_id = uuid.UUID(body.category_id)
    if body.tags is not None:
        doc.tags.clear()
        for tag_name in body.tags:
            tag_result = await db.execute(select(Tag).where(Tag.name == tag_name))
            tag = tag_result.scalar_one_or_none()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
                await db.flush()
            doc.tags.append(tag)

    await db.commit()
    await db.refresh(doc, ["category", "tags"])
    return _serialize_doc(doc)


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await _get_doc_or_404(db, doc_id)

    if doc.file_path:
        try:
            storage.delete(doc.file_path)
        except Exception:
            pass

    try:
        rag.delete_document(str(doc.id))
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()
    return {"message": "문서가 삭제되었습니다."}


@router.get("/{doc_id}/download")
async def download_file(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await _get_doc_or_404(db, doc_id)
    if not doc.file_path:
        raise HTTPException(status_code=404, detail="첨부 파일이 없습니다.")
    url = storage.get_presigned_url(doc.file_path)
    return {"download_url": url}


async def _get_doc_or_404(db: AsyncSession, doc_id: str) -> Document:
    query = (
        select(Document)
        .options(selectinload(Document.category), selectinload(Document.tags))
        .where(Document.id == uuid.UUID(doc_id))
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc


def _serialize_doc(doc: Document) -> dict:
    return {
        "id": str(doc.id),
        "title": doc.title,
        "content": doc.content,
        "summary": doc.summary,
        "category": {
            "id": str(doc.category.id),
            "name": doc.category.name,
            "icon": doc.category.icon,
            "color": doc.category.color,
        } if doc.category else None,
        "tags": [{"id": str(t.id), "name": t.name} for t in doc.tags],
        "file_path": doc.file_path,
        "file_name": doc.file_name,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "author": doc.author,
        "doc_type": doc.doc_type,
        "keywords": doc.keywords or [],
        "is_indexed": doc.is_indexed,
        "views": doc.views,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }
