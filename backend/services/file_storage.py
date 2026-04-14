"""
MinIO 파일 저장소 서비스
"""
import uuid
import logging
from io import BytesIO
from minio import Minio
from config import settings

logger = logging.getLogger(__name__)


class FileStorage:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
            logger.info("Created MinIO bucket: %s", self.bucket)

    def upload(self, file_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
        object_name = f"{uuid.uuid4()}/{filename}"
        self.client.put_object(
            self.bucket,
            object_name,
            BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=content_type,
        )
        logger.info("Uploaded file to MinIO: %s", object_name)
        return object_name

    def download(self, object_name: str) -> bytes:
        response = self.client.get_object(self.bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def delete(self, object_name: str):
        self.client.remove_object(self.bucket, object_name)
        logger.info("Deleted file from MinIO: %s", object_name)

    def get_presigned_url(self, object_name: str, expires_hours: int = 1) -> str:
        from datetime import timedelta
        return self.client.presigned_get_object(
            self.bucket,
            object_name,
            expires=timedelta(hours=expires_hours),
        )
