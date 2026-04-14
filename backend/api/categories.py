"""
카테고리 및 태그 API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.category import Category
from models.document import Document
from models.tag import Tag

router = APIRouter(prefix="/api", tags=["categories"])


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    query = (
        select(
            Category,
            func.count(Document.id).label("doc_count"),
        )
        .outerjoin(Document, Document.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.sort_order)
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": str(cat.id),
            "name": cat.name,
            "icon": cat.icon,
            "color": cat.color,
            "sort_order": cat.sort_order,
            "doc_count": count,
        }
        for cat, count in rows
    ]


@router.get("/tags")
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()
    return [{"id": str(t.id), "name": t.name} for t in tags]
