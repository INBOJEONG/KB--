import uuid
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(10))
    color: Mapped[str | None] = mapped_column(String(7))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    documents: Mapped[list["Document"]] = relationship(back_populates="category")


# Default categories to seed
DEFAULT_CATEGORIES = [
    {"name": "일반", "icon": "📋", "color": "#5b5fc7", "sort_order": 0},
    {"name": "인사/총무", "icon": "👥", "color": "#c44569", "sort_order": 1},
    {"name": "개발/기술", "icon": "💻", "color": "#0ea47a", "sort_order": 2},
    {"name": "영업/마케팅", "icon": "📊", "color": "#e08b2d", "sort_order": 3},
    {"name": "재무/회계", "icon": "💰", "color": "#7c5cbf", "sort_order": 4},
    {"name": "사내규정", "icon": "📜", "color": "#d94452", "sort_order": 5},
]
