from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Use settings.DATABASE_DSN: handles sqlite:// and postgres:// -> postgresql://
SQLALCHEMY_DATABASE_URL = settings.DATABASE_DSN

# SQLite requires check_same_thread=False for multi-threaded use
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a SQLAlchemy session and guarantees cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Create all tables defined in models. Safe to call multiple times (IF NOT EXISTS)."""
    # Import models here so they register on Base.metadata before create_all
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)


# Async wrappers for main.py startup/shutdown hooks
async def init_db_pool():
    create_all_tables()
    print("[VaultID] SQLite schema initialised — all tables ready.")


async def close_db_pool():
    pass  # SQLite needs no pool teardown