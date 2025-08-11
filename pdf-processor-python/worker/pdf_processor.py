# worker/pdf_processor.py
import pika  # RabbitMQ library
import json  # For parsing JSON messages
import logging
import sys
import signal
import time
from typing import Dict, Any
from ..app.config import config
from ..app.database import test_connection, init_db
from ..app.services.minio_client import minio_client
from ..app.services.embeddings import embedding_service
from ..app.services.storage import storage_service

# Set up logging to see what's happening
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Main class that processes PDF files from RabbitMQ queue
    """
    
    def __init__(self):
        """Initialize the processor"""
        self.connection = None  # RabbitMQ connection
        self.channel = None     # RabbitMQ channel
        self.should_stop = False  # Flag to control shutdown
        
        # Python explanation: signal handlers let us gracefully shutdown
        signal.signal(signal.SIGINT, self._signal_handler)   # Ctrl+C
        signal.signal(signal.SIGTERM, self._signal_handler)  # Docker stop
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.should_stop = True
        if self.channel:
            self.channel.stop_consuming()
    
    def connect_rabbitmq(self):
        """Connect to RabbitMQ with retry logic"""
        max_retries = 5
        retry_delay = 5
        
        # Python explanation: for loop with range() repeats a specific number of times
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to RabbitMQ (attempt {attempt + 1}/{max_retries})")
                
                # Create connection to RabbitMQ
                self.connection = pika.BlockingConnection(
                    pika.URLParameters(config.RABBITMQ_URL)
                )
                self.channel = self.connection.channel()
                
                # Make sure our queue exists
                self.channel.queue_declare(queue='pdf_jobs', durable=True)
                
                # Process one message at a time
                self.channel.basic_qos(prefetch_count=1)
                
                logger.info("Connected to RabbitMQ successfully")
                return True
                
            except Exception as e:
                logger.error(f"RabbitMQ connection failed: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    return False
    
    def process_pdf_message(self, ch, method, properties, body):
        """
        Process a single PDF job from the queue
        
        Args:
            ch: RabbitMQ channel
            method: Message delivery info
            properties: Message properties
            body: The actual message content (JSON)
        """
        job_data = None
        temp_file_path = None
        
        try:
            # Python explanation: json.loads() converts JSON string to Python dict
            job_data = json.loads(body)
            
            # Extract information from the job
            project_id = job_data.get('projectId')
            file_id = job_data.get('fileId')
            filename = job_data.get('filename')
            minio_path = job_data.get('minioPath')
            
            logger.info(f"Processing PDF: {filename} (file_id: {file_id})")
            
            # Step 1: Update status to processing
            storage_service.update_file_processing_status(file_id, 'processing')
            
            # Step 2: Download PDF from MinIO
            logger.info(f"Downloading PDF from MinIO: {minio_path}")
            temp_file_path = minio_client.download_file(minio_path)
            
            # Step 3: Process PDF (extract text, create chunks, generate embeddings)
            logger.info("Extracting text and generating embeddings...")
            chunks, embeddings = embedding_service.process_pdf(temp_file_path)
            
            # Step 4: Store in database
            logger.info("Storing embeddings in database...")
            # Delete any existing embeddings for this file
            storage_service.delete_existing_embeddings(file_id)
            # Store new embeddings
            storage_service.store_embeddings(file_id, project_id, chunks, embeddings)
            
            # Step 5: Mark as completed
            storage_service.update_file_processing_status(file_id, 'completed')
            
            logger.info(f"PDF processing completed successfully: {filename}")
            
            # Tell RabbitMQ we processed the message successfully
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message: {e}")
            # Don't requeue invalid messages
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            
            # Update status to failed
            if job_data and job_data.get('fileId'):
                storage_service.update_file_processing_status(
                    job_data['fileId'], 'failed'
                )
            
            # Reject the message (RabbitMQ will handle retries)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        finally:
            # Always clean up temporary files
            if temp_file_path:
                minio_client.cleanup_temp_file(temp_file_path)
    
    def start_consuming(self):
        """Start the worker and begin processing jobs"""
        try:
            logger.info("Starting PDF processor worker...")
            
            # Check database connection
            if not test_connection():
                logger.error("Database connection failed")
                sys.exit(1)
            
            # Initialize database
            init_db()
            
            # Connect to RabbitMQ
            if not self.connect_rabbitmq():
                logger.error("Failed to connect to RabbitMQ")
                sys.exit(1)
            
            # Tell RabbitMQ to call our function when messages arrive
            self.channel.basic_consume(
                queue='pdf_jobs',
                on_message_callback=self.process_pdf_message
            )
            
            logger.info("PDF processor is ready. Waiting for jobs...")
            logger.info("Press CTRL+C to exit")
            
            # Main loop - keep processing messages
            while not self.should_stop:
                try:
                    # Process messages for 1 second, then check if we should stop
                    self.connection.process_data_events(time_limit=1)
                except Exception as e:
                    logger.error(f"Error in message processing: {e}")
                    break
            
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Fatal error: {e}")
        finally:
            self._cleanup()
    
    def _cleanup(self):
        """Clean up connections when shutting down"""
        try:
            if self.channel and not self.channel.is_closed:
                self.channel.close()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            logger.info("Shutdown complete")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

def main():
    """Main entry point - create and start the processor"""
    processor = PDFProcessor()
    processor.start_consuming()

if __name__ == '__main__':
    main()
