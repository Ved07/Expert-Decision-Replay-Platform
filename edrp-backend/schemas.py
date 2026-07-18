from ast import List
from typing import List
from pydantic import BaseModel
from datetime import datetime
from models import DecisionStatus
from models import ApprovalDecision

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
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

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

# Define a schema for alternative creation
class AlternativeCreate(BaseModel):
    title: str
    pros: str | None = None
    cons: str | None = None
    estimated_cost: str | None = None
    feasibility_notes: str | None = None
    risk_notes: str | None = None

# Define a schema for alternative output
class AlternativeOut(BaseModel):
    id: int
    decision_id: int
    title: str
    pros: str | None
    cons: str | None
    estimated_cost: str | None
    feasibility_notes: str | None
    risk_notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True

# Define a schema for attachment output
class AttachmentOut(BaseModel):
    id: int
    decision_id: int
    original_filename: str
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Define a schema for comment creation
class CommentCreate(BaseModel):
    content: str

# Define a schema for comment output
class CommentOut(BaseModel):
    id: int
    decision_id: int
    author_id: int
    author_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# Define a schema for approval creation
class ApprovalCreate(BaseModel):
    outcome: ApprovalDecision
    comments: str | None = None

# Define a schema for approval output
class ApprovalOut(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int
    reviewer_name: str
    outcome: ApprovalDecision
    comments: str | None
    reviewed_at: datetime

    class Config:
        from_attributes = True

class TeamMemberOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

# Define a schema for team detail output
class TeamDetailOut(BaseModel):
    id: int
    name: str
    manager_id: int | None
    manager_name: str | None
    members: List[TeamMemberOut]

# Define a schema for team update
class TeamUpdate(BaseModel):
    name: str | None = None
    manager_id: int | None = None


class NotificationOut(BaseModel):
    id: int
    message: str
    link: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionVersionOut(BaseModel):
    id: int
    version_number: int
    title: str
    problem_statement: str
    status: DecisionStatus
    changed_by: int
    changed_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True