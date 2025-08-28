# app/services/storage.py
from sqlalchemy.orm import Session
from sqlalchemy import update
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from ..database import SessionLocal
from ..models import Project, File, Chunk

# Python explanation: logging helps us track what the program is doing
logger = logging.getLogger(__name__)

class StorageService:
    """
    This class handles all database operations
    Think of it as a service that talks to your database
    """
    
    def __init__(self):
        """Constructor - runs when StorageService() is created"""
        pass
    
    def get_file_by_id(self, file_id: str) -> Optional[File]:
        """
        Get a file record from database by ID
        
        Args:
            file_id: The UUID string of the file
            
        Returns:
            File object or None if not found
        """
        # Python explanation: 'with' automatically closes the database connection
        db = SessionLocal()  # Create database connection
        try:
            # Query the File table where id matches file_id
            file = db.query(File).filter(File.id == file_id).first()
            return file
        except Exception as e:
            logger.error(f"Error getting file {file_id}: {e}")
            return None
        finally:
            db.close()  # Always close the connection
    
    def update_file_processing_status(
        self, 
        file_id: str, 
        status: str, 
        error_message: str = None
    ):
        """
        Update the processing status of a file
        
        Args:
            file_id: File UUID
            status: New status (pending, processing, completed, failed)
            error_message: Optional error message if status is failed
        """
        db = SessionLocal()
        try:
            # Python explanation: This updates the database record
            db.execute(
                update(File)  # Update the File table
                .where(File.id == file_id)  # Where id matches
                .values(processing_status=status)  # Set new values
            )
            db.commit()  # Save changes to database
            logger.info(f"Updated file {file_id} status to {status}")
            
        except Exception as e:
            db.rollback()  # Undo changes if error occurs
            logger.error(f"Failed to update file status: {e}")
            raise  # Re-raise the error
        finally:
            db.close()
    
    def store_embeddings(
        self,
        file_id: str,
        project_id: str,
        chunks: List[Any],  # List of LangChain Document objects
        embeddings: List[List[float]]  # List of vector embeddings (one per chunk)
    ):
        """
        Store text chunks and their embeddings in the database
        
        Args:
            file_id: UUID of the source file
            project_id: UUID of the project
            chunks: List of text chunks (LangChain Documents)
            embeddings: List of vector embeddings (one per chunk)
        """
        db = SessionLocal()
        try:
            embedding_records = []
            
            # Python explanation: zip() pairs up items from two lists
            # enumerate() gives us the index (0, 1, 2...) and the item
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                # Create a new Chunk record
                embedding_record = Chunk(
                    project_id=project_id,
                    file_id=file_id,
                    content=chunk.page_content,  # The actual text
                    vector=embedding,  # The vector representation
                    chunk_index=i,  # Which chunk number this is
                    page_number=chunk.metadata.get('page_number'),  # From PDF page
                    # Additional metadata fields if available
                    char_start=chunk.metadata.get('char_start'),
                    char_end=chunk.metadata.get('char_end'),
                    # metadata field was commented out in the model
                    updated_at=datetime.utcnow()  # Set updated_at to now
                )
                embedding_records.append(embedding_record)
            
            # Python explanation: add_all() inserts multiple records at once
            db.add_all(embedding_records)
            db.commit()
            
            logger.info(f"Stored {len(embedding_records)} embeddings for file {file_id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to store embeddings: {e}")
            raise
        finally:
            db.close()
    
    def delete_existing_embeddings(self, file_id: str):
        """
        Delete all embeddings for a file (useful for reprocessing)
        
        Args:
            file_id: UUID of the file
        """
        db = SessionLocal()
        try:
            # Delete all chunk records where file_id matches
            deleted = db.query(Chunk).filter(
                Chunk.file_id == file_id
            ).delete()
            db.commit()
            logger.info(f"Deleted {deleted} chunks for file {file_id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete chunks: {e}")
            raise
        finally:
            db.close()

# Create a global instance to use throughout the application
storage_service = StorageService()
#             raise
#         finally:
#             db.close()

# # Create a global instance to use throughout the application
# storage_service = StorageService()
