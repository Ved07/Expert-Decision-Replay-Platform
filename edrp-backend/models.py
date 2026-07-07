from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy import ForeignKey


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="Employee")
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)