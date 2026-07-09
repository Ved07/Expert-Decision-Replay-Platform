from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy import ForeignKey
import enum
from sqlalchemy import Enum as SQLEnum, DateTime, Text
from sqlalchemy.sql import func

# Define your SQLAlchemy models here
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="Employee")
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

# Define the Team model
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)



# Define the Decision model
class DecisionStatus(str, enum.Enum):
    """
    Inheriting from both str and enum.Enum means each value behaves
    like a normal string everywhere (easy to compare, easy to return
    in an API response), while still being restricted to exactly
    these five options.
    """
    DRAFT = "Draft"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=False)

    status = Column(SQLEnum(DecisionStatus), nullable=False, default=DecisionStatus.DRAFT)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Define the Alternative model
class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

    title = Column(String, nullable=False)
    pros = Column(Text, nullable=True)
    cons = Column(Text, nullable=True)
    estimated_cost = Column(String, nullable=True)
    feasibility_notes = Column(Text, nullable=True)
    risk_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

# # Define the Attachment model
# class Attachment(Base):
#     __tablename__ = "attachments"

#     id = Column(Integer, primary_key=True, index=True)
#     decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

#     original_filename = Column(String, nullable=False)
#     stored_filename = Column(String, nullable=False, unique=True)
#     uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

#     uploaded_at = Column(DateTime(timezone=True), server_default=func.now())