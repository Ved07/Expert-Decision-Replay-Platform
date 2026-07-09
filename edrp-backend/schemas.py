from pydantic import BaseModel
from datetime import datetime
from models import DecisionStatus

# Define your Pydantic schemas here
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

# Define a schema for user login
class UserLogin(BaseModel):
    email: str
    password: str

# Define a schema for user output (excluding password)
class TeamCreate(BaseModel):
    name: str
    manager_id: int | None = None


# Define a schema for user output (excluding password)
class TeamOut(BaseModel):
    id: int
    name: str
    manager_id: int | None

    class Config:
        from_attributes = True


# Define a schema for decision creation
class DecisionCreate(BaseModel):
    title: str
    problem_statement: str


# Define a schema for decision update
class DecisionUpdate(BaseModel):
    title: str | None = None
    problem_statement: str | None = None
    status: DecisionStatus | None = None


# Define a schema for decision output
class DecisionOut(BaseModel):
    id: int
    title: str
    problem_statement: str
    status: DecisionStatus
    created_by: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
        