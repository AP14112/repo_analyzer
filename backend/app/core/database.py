from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings, Settings



settings = get_settings()

print("=" * 60)
print("DATABASE_URL =", settings.database_url)
print("=" * 60)

engine = create_engine(
    settings.database_url,
    echo=True,
)

engine = create_engine(
    settings.database_url,
    echo=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()