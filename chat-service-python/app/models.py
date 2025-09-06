from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, ForeignKey, Float
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from .database import Base


def uuid_str():
    return str(uuid.uuid4())


class Project(Base):
    """
    Project model representing a collection of related documents.
    
    Projects serve as a way to organize multiple documents together 
    for a specific purpose or analysis task.
    """
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=uuid_str)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="creating")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class File(Base):
    """
    File model representing metadata for uploaded files.

    This table stores high-level information about each file without the content itself.
    It serves as a parent record for Chunk entries, which contain the actual text
    content and vector embeddings.

    Each file belongs to a project, allowing for organization of documents by project.
    """
    __tablename__ = "files"
    
    id = Column(String, primary_key=True, default=uuid_str)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)  # S3/MinIO path
    mime_type = Column(String)
    file_size = Column(Integer)
    upload_status = Column(String, default="pending")
    processing_status = Column(String, default="pending")
    file_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Chunk(Base):
    """
    Chunk model representing segments of text extracted from documents.

    This table stores the actual content from documents that has been split into
    manageable chunks. Each chunk is associated with its source file and project,
    and includes a vector embedding representation for semantic search capabilities.

    The vector dimension (384) must match the output dimension of the embedding model
    specified in config.py (MiniLM-L6-v2 produces 384-dimensional vectors).
    """
    __tablename__ = "chunks"
    
    id = Column(String, primary_key=True, default=uuid_str)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    file_id = Column(String, ForeignKey("files.id"), nullable=False)
    content = Column(Text, nullable=False)
    vector = Column(Vector(384))  # MiniLM-L6-v2 embedding size
    chunk_index = Column(Integer)
    page_number = Column(Integer)
    char_start = Column(Integer)
    char_end = Column(Integer)
    chunk_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# class ProcessingJob(Base):
#     """
#     ProcessingJob model for tracking background document processing tasks.
    
#     This model allows monitoring the status of asynchronous document processing jobs,
#     including parsing, chunking, and embedding generation.
#     """
#     __tablename__ = "processing_jobs"
    
#     id = Column(String, primary_key=True, default=uuid_str)
#     file_id = Column(String, ForeignKey("files.id"), nullable=False)
#     job_id = Column(String, unique=True, nullable=False)
#     status = Column(String, default="pending")
#     error_message = Column(Text)
#     progress = Column(Float, default=0.0)
#     started_at = Column(DateTime(timezone=True))
#     completed_at = Column(DateTime(timezone=True))
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())