import uuid
from datetime import datetime
from sqlalchemy import String, Text, BigInteger, Integer, Boolean, ForeignKey, ARRAY, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from models.tag import document_tags


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"))
    file_path: Mapped[str | None] = mapped_column(String(1000))
    file_name: Mapped[str | None] = mapped_column(String(500))
    file_type: Mapped[str | None] = mapped_column(String(20))
    file_size: Mapped[int | None] = mapped_column(BigInteger)
    author: Mapped[str | None] = mapped_column(String(200))
    doc_type: Mapped[str] = mapped_column(String(10), default="file")  # 'doc' or 'file'
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    is_indexed: Mapped[bool] = mapped_column(Boolean, default=False)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    category: Mapped["Category | None"] = relationship(back_populates="documents")
    tags: Mapped[list["Tag"]] = relationship(secondary=document_tags)
