from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from typing import List, Tuple, Dict, Any
import logging
import torch
from ..database import SessionLocal
from ..config import config

# Set up logger for this module
logger = logging.getLogger(__name__)  # Fix: changed from 'name' to '__name__'


class RetrievalService:
    """
    Service for retrieving relevant document chunks based on semantic similarity.

    This class handles:
    1. Loading and using an embedding model to convert text to vectors
    2. Searching for similar document chunks in the vector database
    3. Assembling context from the most relevant chunks
    """

    def __init__(self):
        """
        Initialize the retrieval service and load the embedding model.
        """
        self.model = None
        self._load_model()

    def _load_model(self):
        """
        Load the sentence transformer model for generating embeddings.

        This method attempts to use CUDA if available for faster inference,
        otherwise falls back to CPU. The model is loaded from the configured
        embedding model path and cached to avoid redownloading.

        Raises:
            Exception: If the model fails to load
        """
        try:
            # Use GPU acceleration if available
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading embedding model on device: {device}")

            # Load the sentence transformer model
            self.model = SentenceTransformer(
                config.EMBEDDING_MODEL,
                device=device,
                cache_folder=config.HF_HOME,  # Cache models to avoid redownloading
            )
            logger.info(f"Loaded model: {config.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate vector embedding for a query string.

        Args:
            query: The user's question or search query

        Returns:
            List of floats representing the query's vector embedding

        Raises:
            Exception: If embedding generation fails
        """
        try:
            # Convert query text to vector representation
            emb = self.model.encode(query, convert_to_tensor=False)
            return emb.tolist()  # Convert numpy array to Python list
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            raise

    def similarity_search(
        self,
        query_embedding: List[float],
        project_id: str,
        top_k: int | None = None,
        min_similarity: float | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for document chunks similar to the query embedding.

        This method performs a vector similarity search using pgvector in the database.
        It retrieves the most semantically similar document chunks to the query.

        Args:
            query_embedding: Vector representation of the query
            project_id: ID of the project to search within
            top_k: Maximum number of results to return (defaults to config setting)
            min_similarity: Minimum similarity threshold (defaults to config setting)

        Returns:
            List of document chunks with their metadata and similarity scores

        Raises:
            Exception: If the database query fails
        """
        # Use configuration defaults if parameters not provided
        top_k = top_k or config.TOP_K_RESULTS
        min_similarity = min_similarity or config.MIN_SIMILARITY_SCORE

        db = SessionLocal()
        try:
            # Convert embedding list to string format for SQL query
            emb_str = "[" + ",".join(map(str, query_embedding)) + "]"

            # SQL query using pgvector's distance operator (<=>)
            # We convert distance to similarity score with the formula: similarity = 1 - distance
            sql = text(
                """
                SELECT 
                c.id,
                c.content,
                c.chunk_index,
                c.page_number,
                c.chunk_metadata as metadata,
                f.filename,
                c.file_id,
                1 - (c.vector <=> :qv) as similarity_score
                FROM chunks c
                JOIN files f ON f.id = c.file_id
                WHERE c.project_id = :project_id
                AND (1 - (c.vector <=> :qv)) >= :min_sim
                ORDER BY c.vector <=> :qv
                LIMIT :k
                """
            )

            # Execute the vector search query
            rows = db.execute(
                sql,
                {
                    "qv": emb_str,  # Query vector
                    "project_id": project_id,  # Scope to specific project
                    "min_sim": min_similarity,  # Filter by minimum similarity
                    "k": top_k,  # Limit number of results
                },
            )

            # Process and format the results
            out = []
            for r in rows:
                out.append(
                    {
                        "id": r.id,
                        "content": r.content,
                        "chunk_index": r.chunk_index,
                        "page_number": r.page_number,
                        "metadata": r.metadata or {},
                        "filename": r.filename,
                        "file_id": r.file_id,
                        "similarity_score": float(r.similarity_score),
                    }
                )
            logger.info(f"Retrieved {len(out)} chunks for project {project_id}")
            return out
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            raise
        finally:
            db.close()

    def retrieve_context(
        self, query: str, project_id: str
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Build context for answering a query by retrieving relevant document chunks.

        This method:
        1. Generates an embedding for the query
        2. Performs similarity search to find relevant chunks
        3. Formats the chunks into a context string, respecting max length limits

        Args:
            query: The user's question
            project_id: ID of the project to search within

        Returns:
            Tuple of (formatted_context_string, list_of_used_chunks)

        Raises:
            Exception: If context retrieval fails
        """
        try:
            # Generate vector embedding for the query
            qv = self.generate_query_embedding(query)

            # Find similar document chunks
            chunks = self.similarity_search(qv, project_id)
            if not chunks:
                return "", []  # No relevant chunks found

            # Build context string from chunks while respecting max length
            parts = []
            total = 0  # Track total context length
            used = []  # Track which chunks were included

            for ch in chunks:
                # Format chunk with source information
                head = f"Source: {ch['filename']}"
                if ch["page_number"]:
                    head += f" (Page {ch['page_number']})"
                piece = head + "\n" + ch["content"] + "\n"

                # Check if adding this chunk would exceed max context length
                if total + len(piece) > config.MAX_CONTEXT_LENGTH:
                    break  # Stop adding chunks if we reach the limit

                # Add chunk to context
                parts.append(piece)
                used.append(ch)
                total += len(piece)

            # Combine all chunks into a single context string
            return "\n".join(parts), used
        except Exception as e:
            logger.error(f"Context build failed: {e}")
            raise


# Create a singleton instance of the service for use throughout the application
retrieval_service = RetrievalService()
