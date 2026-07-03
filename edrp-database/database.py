from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# This is the "address" of our database. For SQLite, it's just a file
# on disk called edrp.db, which will be created automatically.
DATABASE_URL = "sqlite:///./edrp.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()