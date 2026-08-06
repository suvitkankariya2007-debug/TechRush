"""
Shared asyncpg connection pool.

Import get_pool() anywhere a module needs the DB -- it creates the pool
once on first call and reuses it for the rest of the process, so
modules 1, 2, 3, 6, 8 should reuse THIS file too rather than each
opening their own connection.
"""

from typing import Optional

import asyncpg

from app.config import DATABASE_URL

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
