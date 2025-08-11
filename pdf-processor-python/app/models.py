# app/models.py
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from .database import Base

# Python explanation: This creates database table models
# Each class represents a table, each Column represents a field

class Project(Base):
    """
    Represents the 'projects' table
    Base is a SQLAlchemy class that gives us database functionality
    """
    __tablename__ = "projects"  # Must match your Prisma @@map name
    
    # Column definitions - these must match your Prisma schema exactly
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default='CREATING')  # CREATING, FAILED, CREATED
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

class File(Base):
    """Represents the 'files' table"""
    __tablename__ = "files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projectId = Column(String, nullable=False)  # Foreign key to projects table
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)  # MinIO path
    processingStatus = Column(String, default='pending')  # New field
    fileSize = Column(Integer)  # New field (optional)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class Embedding(Base):
    """Represents the 'embeddings' table"""
    __tablename__ = "embeddings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projectId = Column(String, nullable=False)
    fileId = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # The text chunk
    vector = Column(Vector(384))  # The embedding vector (384 dimensions for MiniLM)
    chunkIndex = Column(Integer)  # New field
    pageNumber = Column(Integer)  # New field
    metadata = Column(JSON, default={})  # New field
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
