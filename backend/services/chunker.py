"""
텍스트 청크 분할 서비스
"""
from langchain_text_splitters import RecursiveCharacterTextSplitter


class TextChunker:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    def split(self, text: str) -> list[str]:
        if not text or not text.strip():
            return []
        return self.splitter.split_text(text)
