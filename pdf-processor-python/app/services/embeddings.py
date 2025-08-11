from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFLoader, PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from typing import List, Tuple
import logging
import torch
from ..config import config

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self._load_model()
    
    def _load_model(self):
        """Load the embedding model"""
        try:
            # Set device
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            # device = 'cpu'
            logger.info(f"Loading embedding model on device: {device}")
            
            self.model = SentenceTransformer(
                config.EMBEDDING_MODEL,
                device=device,
                cache_folder=config.HF_HOME
            )
            logger.info(f"Loaded model: {config.EMBEDDING_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def extract_text_from_pdf(self, pdf_path: str) -> List[Document]:
        """Extract text from PDF using LangChain loaders"""
        try:
            # Try PyMuPDFLoader first (better for complex layouts)
            try:
                loader = PyMuPDFLoader(pdf_path)
                documents = loader.load()
                logger.info(f"Extracted {len(documents)} pages using PyMuPDFLoader")
            except Exception as e:
                logger.warning(f"PyMuPDFLoader failed, falling back to PyPDFLoader: {e}")
                # Fallback to PyPDFLoader
                loader = PyPDFLoader(pdf_path)
                documents = loader.load()
                logger.info(f"Extracted {len(documents)} pages using PyPDFLoader")
            
            # Add page metadata
            for i, doc in enumerate(documents):
                doc.metadata.update({
                    'page_number': i + 1,
                    'source': pdf_path
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise
    
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks"""
        try:
            chunks = []
            for doc in documents:
                doc_chunks = self.text_splitter.split_documents([doc])
                
                # Add chunk metadata
                for i, chunk in enumerate(doc_chunks):
                    chunk.metadata.update({
                        'chunk_index': i,
                        'page_number': doc.metadata.get('page_number'),
                        'char_count': len(chunk.page_content)
                    })
                    chunks.append(chunk)
            
            logger.info(f"Created {len(chunks)} chunks from {len(documents)} documents")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to chunk documents: {e}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            if not self.model:
                raise ValueError("Embedding model not loaded")
            
            # Generate embeddings in batches for memory efficiency
            batch_size = 32
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_embeddings = self.model.encode(
                    batch,
                    convert_to_tensor=False,
                    show_progress_bar=False
                )
                all_embeddings.extend(batch_embeddings.tolist())
            
            logger.info(f"Generated embeddings for {len(texts)} texts")
            return all_embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    def process_pdf(self, pdf_path: str) -> Tuple[List[Document], List[List[float]]]:
        """
        Complete PDF processing pipeline
        Returns: (chunks, embeddings)
        """
        try:
            # Extract text
            documents = self.extract_text_from_pdf(pdf_path)
            
            # Create chunks
            chunks = self.chunk_documents(documents)
            
            # Generate embeddings
            texts = [chunk.page_content for chunk in chunks]
            embeddings = self.generate_embeddings(texts)
            
            logger.info(f"Processed PDF: {len(chunks)} chunks, {len(embeddings)} embeddings")
            return chunks, embeddings
            
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            raise

# Global instance
embedding_service = EmbeddingService()
