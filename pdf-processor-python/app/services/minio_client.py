from minio import Minio
from minio.error import S3Error
import logging
import tempfile
import os
from ..config import config

logger = logging.getLogger(__name__)

class MinIOClient:
    def __init__(self):
        self.client = Minio(
            config.MINIO_ENDPOINT.replace('http://', ''),
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=False  # Set to True for HTTPS
        )
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Ensure the bucket exists"""
        try:
            if not self.client.bucket_exists(config.MINIO_BUCKET):
                self.client.make_bucket(config.MINIO_BUCKET)
                logger.info(f"Created bucket: {config.MINIO_BUCKET}")
        except S3Error as e:
            logger.error(f"Error creating bucket: {e}")
            raise
    
    def download_file(self, object_name: str) -> str:
        """
        Download file from MinIO to temporary location
        Returns path to downloaded file
        """
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                delete=False, 
                suffix='.pdf'
            )
            temp_path = temp_file.name
            temp_file.close()
            
            # Download from MinIO
            self.client.fget_object(
                config.MINIO_BUCKET,
                object_name,
                temp_path
            )
            
            logger.info(f"Downloaded {object_name} to {temp_path}")
            return temp_path
            
        except S3Error as e:
            logger.error(f"Error downloading {object_name}: {e}")
            raise
    
    def cleanup_temp_file(self, file_path: str):
        """Remove temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.debug(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {file_path}: {e}")

# Global instance
minio_client = MinIOClient()
