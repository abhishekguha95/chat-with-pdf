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
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

class File(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True, default=uuid_str)
    projectId = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    originalFilename = Column(String)  # optional
    url = Column(String, nullable=False)  # MinIO/S3 path
    mimeType = Column(String)
    fileSize = Column(Integer)
    uploadStatus = Column(String, default="uploaded")
    processingStatus = Column(String, default="pending")
    metadata = Column(JSON)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(String, primary_key=True, default=uuid_str)
    projectId = Column(String, nullable=False)
    fileId = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    vector = Column(Vector(384))  # nullable by default in SQLAlchemy; set nullable=True if desired
    chunkIndex = Column(Integer)
    pageNumber = Column(Integer)
    charStart = Column(Integer)
    charEnd = Column(Integer)
    metadata = Column(JSON)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(String, primary_key=True, default=uuid_str)
    fileId = Column(String, nullable=False)
    jobId = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")
    errorMessage = Column(Text)
    progress = Column(Float, default=0.0)
    startedAt = Column(DateTime(timezone=True))
    completedAt = Column(DateTime(timezone=True))
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
