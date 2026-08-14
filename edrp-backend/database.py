import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker, declarative_base
import urllib

load_dotenv()  # reads .env and loads DB_PASSWORD, JWT_SECRET_KEY, etc.

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "postgres")
)

# Retrieve and URL‑encode the DB password, then replace placeholder
# _db_password = urllib.parse.quote_plus(os.getenv("DB_PASSWORD", ""))
# DATABASE_URL = os.getenv("DATABASE_URL").replace("[DB_PASSWORD]", _db_password)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()