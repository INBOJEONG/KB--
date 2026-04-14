"""
임베딩 서비스 - multilingual-e5-large + ChromaDB
"""
import logging
import chromadb
from sentence_transformers import SentenceTransformer
from config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "kb_documents"


class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.chroma = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
        self.collection = self.chroma.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    def embed_passages(self, texts: list[str]) -> list[list[float]]:
        prefixed = [f"passage: {t}" for t in texts]
        return self.model.encode(prefixed).tolist()

    def embed_query(self, query: str) -> list[float]:
        return self.model.encode(f"query: {query}").tolist()

    def add_chunks(self, doc_id: str, title: str, chunks: list[str]):
        if not chunks:
            return
        embeddings = self.embed_passages(chunks)
        self.collection.add(
            ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
            embeddings=embeddings,
            documents=chunks,
            metadatas=[
                {"doc_id": doc_id, "title": title, "chunk_idx": i}
                for i in range(len(chunks))
            ],
        )
        logger.info("Indexed %d chunks for document %s", len(chunks), doc_id)

    def search(self, query: str, top_k: int = 5) -> dict:
        query_embedding = self.embed_query(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def delete_document(self, doc_id: str):
        self.collection.delete(where={"doc_id": doc_id})
        logger.info("Deleted vectors for document %s", doc_id)
