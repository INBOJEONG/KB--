import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, ARRAY, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class SearchLog(Base):
    __tablename__ = "search_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    query: Mapped[str] = mapped_column(Text, nullable=False)
    result_ids: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    response: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
