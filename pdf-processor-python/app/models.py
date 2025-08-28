# app/models.py
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Float
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from .database import Base

def uuid_str():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=uuid_str)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="CREATING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class File(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True, default=uuid_str)
    project_id = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String)  # optional
    url = Column(String, nullable=False)  # MinIO/S3 path
    mime_type = Column(String)
    file_size = Column(Integer)
    upload_status = Column(String, default="uploaded")
    processing_status = Column(String, default="pending")
    # metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(String, primary_key=True, default=uuid_str)
    project_id = Column(String, nullable=False)
    file_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    vector = Column(Vector(384))  # nullable by default in SQLAlchemy; set nullable=True if desired
    chunk_index = Column(Integer)
    page_number = Column(Integer)
    char_start = Column(Integer)
    char_end = Column(Integer)
    # metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(String, primary_key=True, default=uuid_str)
    file_id = Column(String, nullable=False)
    job_id = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")
    error_message = Column(Text)
    progress = Column(Float, default=0.0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
