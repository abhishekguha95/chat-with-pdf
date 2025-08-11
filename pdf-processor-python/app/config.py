import os
from typing import Optional

class Config:
    # Database
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL', 
        'postgresql+psycopg://postgres:postgres@localhost:5432/chatpdf'
    )
    
    # RabbitMQ
    RABBITMQ_URL: str = os.getenv(
        'RABBITMQ_URL', 
        'amqp://admin:admin@localhost:5672'
    )
    
    # MinIO
    MINIO_ENDPOINT: str = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
    MINIO_ACCESS_KEY: str = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
    MINIO_SECRET_KEY: str = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
    MINIO_BUCKET: str = os.getenv('MINIO_BUCKET', 'pdf-documents')
    
    # Embedding Model
    EMBEDDING_MODEL: str = os.getenv(
        'EMBEDDING_MODEL', 
        'sentence-transformers/all-MiniLM-L6-v2'
    )
    
    # Processing
    CHUNK_SIZE: int = int(os.getenv('CHUNK_SIZE', '1000'))
    CHUNK_OVERLAP: int = int(os.getenv('CHUNK_OVERLAP', '200'))
    
    # HuggingFace Cache
    HF_HOME: str = os.getenv('HF_HOME', '/cache/hf')

config = Config()
