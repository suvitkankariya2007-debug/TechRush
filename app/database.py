from typing import Optional
import asyncpg
from app.config import settings

pool: Optional[asyncpg.Pool] = None


async def init_db_pool():
    """Create the shared connection pool. Call once on app startup."""
    global pool
    pool = await asyncpg.create_pool(dsn=settings.DATABASE_DSN, min_size=1, max_size=10)


async def close_db_pool():
    """Close the shared connection pool. Call once on app shutdown."""
    global pool
    if pool is not None:
        await pool.close()
        pool = None


async def get_db():
    """FastAPI dependency: yields a single connection from the pool."""
    async with pool.acquire() as conn:
        yield conn