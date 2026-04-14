"""
문서 파싱 서비스 - 다양한 파일 형식에서 텍스트 추출
"""
import logging
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

SUPPORTED_TYPES = {
    "pdf", "docx", "doc", "xlsx", "xls", "csv",
    "pptx", "ppt", "txt", "md", "html",
}


class DocumentParser:
    async def parse(self, file_bytes: bytes, filename: str) -> str:
        ext = Path(filename).suffix.lower().lstrip(".")

        if ext in ("txt", "md"):
            return file_bytes.decode("utf-8", errors="ignore")

        if ext == "csv":
            return self._parse_csv(file_bytes)

        return await self._parse_with_unstructured(file_bytes, filename)

    async def _parse_with_unstructured(self, file_bytes: bytes, filename: str) -> str:
        from unstructured.partition.auto import partition

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=Path(filename).suffix
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            elements = partition(filename=tmp_path)
            text = "\n\n".join(str(el) for el in elements)
            return text
        except Exception as e:
            logger.error("Failed to parse %s: %s", filename, e)
            return ""
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def _parse_csv(self, file_bytes: bytes) -> str:
        import pandas as pd
        from io import BytesIO

        df = pd.read_csv(BytesIO(file_bytes))
        return df.to_string(index=False)
