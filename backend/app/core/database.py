import os
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://zoink:zoink@localhost:5432/zoinkdb")
DATABASE_URL_SYNC = os.getenv("DATABASE_URL_SYNC", "postgresql://zoink:zoink@localhost:5432/zoinkdb")


class Base(DeclarativeBase):
    pass


# Lazy engine creation — only created when first accessed
_engine = None
_async_session = None
_sync_engine = None
_SyncSession = None


def get_engine():
    global _engine
    if _engine is None:
        from sqlalchemy.ext.asyncio import create_async_engine
        _engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    return _engine


def get_async_session_maker():
    global _async_session
    if _async_session is None:
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
        _async_session = async_sessionmaker(get_engine(), class_=AsyncSession, expire_on_commit=False)
    return _async_session


def get_sync_engine():
    global _sync_engine
    if _sync_engine is None:
        from sqlalchemy import create_engine
        _sync_engine = create_engine(DATABASE_URL_SYNC, echo=False)
    return _sync_engine


def get_sync_session_maker():
    global _SyncSession
    if _SyncSession is None:
        from sqlalchemy.orm import sessionmaker
        _SyncSession = sessionmaker(bind=get_sync_engine())
    return _SyncSession


# Convenience accessors
@property
def engine():
    return get_engine()


@property
def sync_engine():
    return get_sync_engine()


@property
def SyncSession():
    return get_sync_session_maker()


@property
def async_session():
    return get_async_session_maker()


async def get_db():
    session_maker = get_async_session_maker()
    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
