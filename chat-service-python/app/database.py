from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import logging
from .config import config

# Set up a logger for database operations
logger = logging.getLogger(__name__)  # Fix: changed from 'name' to '__name__'

# Create SQLAlchemy engine with the following configuration:
# - CONNECTION_URL: Database connection string from config
# - StaticPool: Maintains a single connection per engine instance
# - pool_pre_ping: Tests connections before use to avoid stale connections
# - echo: When True, logs all SQL statements (set to False in production)
engine = create_engine(
    config.DATABASE_URL,
    poolclass=StaticPool,
    pool_pre_ping=True,
    echo=False,
)

# Create a factory for database sessions
# - autocommit=False: Transactions are not automatically committed
# - autoflush=False: Changes are not automatically flushed to DB before queries
# - bind=engine: Sessions will use our configured engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
# Models will inherit from this class to be part of SQLAlchemy's ORM
Base = declarative_base()


def get_db():
    """
    Context manager for database sessions.

    This function yields a database session and ensures it's properly closed
    after use, even if exceptions occur. It should be used with dependency
    injection systems (like FastAPI's Depends) to provide database access to
    route handlers.

    Example usage with FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()

    Yields:
        SQLAlchemy Session: An active database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """
    Test the database connection by executing a simple query.

    This function is useful for health checks and startup verification.
    It executes a simple "SELECT 1" query which should succeed if the
    database connection is working properly.

    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        with engine.begin() as conn:
            # Simple query to test connection
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
