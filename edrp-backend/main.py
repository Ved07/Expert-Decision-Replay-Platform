from fastapi import FastAPI, Depends,HTTPException
from sqlalchemy.orm import Session
from database import Base, engine
from schemas import UserCreate, UserLogin
from models import User
from auth import hash_password, verify_password, create_access_token, get_current_user, get_db, require_admin
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from models import Team
from schemas import TeamCreate, TeamOut
from models import Decision, DecisionStatus
from schemas import DecisionCreate, DecisionUpdate, DecisionOut
from models import Alternative
from schemas import AlternativeCreate, AlternativeOut
import os
import uuid
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
from models import Attachment
from schemas import AttachmentOut
from models import Approval, ApprovalDecision, DecisionStatus
from schemas import ApprovalCreate, ApprovalOut

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Root endpoint to check if the backend is running
@app.get("/")
def read_root():
    return {"message": "EDRP backend is running!"}


# @app.get("/greet/{name}")
# def greet_user(name: str):
    # return {"message": f"Hello, {name}! Welcome to EDRP."}


# Create the database tables if they don't exist
# Base.metadata.create_all(bind=engine)


# User management endpoints
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user



# Login endpoint to authenticate users and return a JWT token
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


# Endpoint to get the current logged-in user's details
@app.get("/users/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }


# Admin-only endpoint to list all users
@app.get("/users")
def list_users(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append({"id": u.id, "name": u.name, "email": u.email, "role": u.role})
    return result

# Admin-only endpoint to update a user's role
@app.patch("/users/{user_id}/role")
def update_role(user_id: int, new_role: str, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "role": user.role}


# Team management endpoints
@app.post("/teams", response_model=TeamOut)
def create_team(team: TeamCreate, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_team = Team(name=team.name, manager_id=team.manager_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team

# Admin-only endpoint to list all teams
@app.get("/teams", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Team).all()


# Admin-only endpoint to assign a user to a team
@app.patch("/users/{user_id}/team")
def assign_user_to_team(user_id: int, team_id: int, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user.team_id = team_id
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "team_id": user.team_id}



# Decision management endpoints
@app.post("/decisions", response_model=DecisionOut, status_code=201)
def create_decision(
    payload: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_decision = Decision(
        title=payload.title,
        problem_statement=payload.problem_statement,
        created_by=current_user.id,   # taken from the token, not from the client
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision

# Admin-only endpoint to list all decisions
@app.get("/decisions", response_model=List[DecisionOut])
def list_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Decision).order_by(Decision.created_at.desc()).all()


@app.get("/decisions/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


# Admin-only endpoint to update a decision
@app.patch("/decisions/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only update fields the client actually sent — anything left out stays unchanged
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(decision, field, value)

    db.commit()
    db.refresh(decision)
    return decision

# Admin-only endpoint to delete a decision
@app.delete("/decisions/{decision_id}", status_code=204)
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    db.delete(decision)
    db.commit()
    return None



# Alternative management endpoints
@app.post("/decisions/{decision_id}/alternatives", response_model=AlternativeOut, status_code=201)
def create_alternative(
    decision_id: int,
    payload: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Confirm the parent decision actually exists before attaching anything to it
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_alt = Alternative(decision_id=decision_id, **payload.model_dump())
    db.add(new_alt)
    db.commit()
    db.refresh(new_alt)
    return new_alt

# Admin-only endpoint to list all alternatives for a specific decision
@app.get("/decisions/{decision_id}/alternatives", response_model=List[AlternativeOut])
def list_alternatives(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return db.query(Alternative).filter(Alternative.decision_id == decision_id).all()



# Attachment management endpoints
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Admin-only endpoint to upload an attachment for a specific decision
@app.post("/decisions/{decision_id}/attachments", response_model=AttachmentOut, status_code=201)
async def upload_attachment(
    decision_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Generate a unique, safe filename to avoid overwriting other uploads
    file_extension = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    # Read the uploaded file's contents and write them to disk
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    new_attachment = Attachment(
        decision_id=decision_id,
        original_filename=file.filename,
        stored_filename=stored_name,
        uploaded_by=current_user.id,
    )
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    return new_attachment

# Admin-only endpoint to list all attachments for a specific decision
@app.get("/decisions/{decision_id}/attachments", response_model=List[AttachmentOut])
def list_attachments(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Attachment).filter(Attachment.decision_id == decision_id).all()

# Admin-only endpoint to download a specific attachment
@app.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    return FileResponse(
        path=file_path,
        filename=attachment.original_filename,  # what the browser will name it when saved
    )

# Admin-only endpoint to delete a specific attachment
@app.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only the person who uploaded it (or an Admin) can delete it
    if attachment.uploaded_by != current_user.id and current_user.role != "Administrator":
        raise HTTPException(status_code=403, detail="You can only delete your own uploads")

    # Remove the actual file from disk
    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove the database record
    db.delete(attachment)
    db.commit()
    return None


from models import Comment
from schemas import CommentCreate, CommentOut

# Admin-only endpoint to create a comment for a specific decision
@app.post("/decisions/{decision_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    decision_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_comment = Comment(
        decision_id=decision_id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return CommentOut(
        id=new_comment.id,
        decision_id=new_comment.decision_id,
        author_id=new_comment.author_id,
        author_name=current_user.name,   # we already have this, no extra query needed
        content=new_comment.content,
        created_at=new_comment.created_at,
    )

# Admin-only endpoint to list all comments for a specific decision
@app.get("/decisions/{decision_id}/comments", response_model=List[CommentOut])
def list_comments(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comments = (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    # Build a lookup so we don't query the database once per comment
    author_ids = {c.author_id for c in comments}
    authors = db.query(User).filter(User.id.in_(author_ids)).all()
    author_names = {a.id: a.name for a in authors}

    return [
        CommentOut(
            id=c.id,
            decision_id=c.decision_id,
            author_id=c.author_id,
            author_name=author_names.get(c.author_id, "Unknown"),
            content=c.content,
            created_at=c.created_at,
        )
        for c in comments
    ]


APPROVAL_LEVELS = ["Reviewer", "Manager", "Administrator"]


def get_next_required_role(decision_id: int, db: Session) -> str | None:
    """
    Looks at the approval history for a decision and figures out which
    role needs to review it next.

    Returns:
    - A role name (e.g. "Manager") if that level still needs to review it
    - None if the decision has either been rejected, or has passed
      through every level (fully approved)
    """
    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.reviewed_at.asc())
        .all()
    )

    for approval in approvals:
        if approval.outcome == ApprovalDecision.REJECTED:
            return None  # rejected — no further review needed, it's finished

    # Count how many levels have been passed (approved or escalated past)
    levels_passed = len(approvals)

    if levels_passed >= len(APPROVAL_LEVELS):
        return None  # every level has signed off — fully approved

    return APPROVAL_LEVELS[levels_passed]

# Endpoint to submit an approval for a decision
@app.post("/decisions/{decision_id}/approvals", response_model=ApprovalOut, status_code=201)
def review_decision(
    decision_id: int,
    payload: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    next_required_role = get_next_required_role(decision_id, db)

    if next_required_role is None:
        raise HTTPException(
            status_code=400,
            detail="This decision has already been fully reviewed (approved or rejected).",
        )

    if current_user.role != next_required_role:
        raise HTTPException(
            status_code=403,
            detail=f"This decision currently requires review by a {next_required_role}, not a {current_user.role}.",
        )

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        outcome=payload.outcome,
        comments=payload.comments,
    )
    db.add(new_approval)

    # Figure out the decision's new overall status based on what happens next
    if payload.outcome == ApprovalDecision.REJECTED:
        decision.status = DecisionStatus.REJECTED
    else:
        # Re-check: after adding this approval, is every level now done?
        remaining_role = get_next_required_role(decision_id, db)
        # (the current approval isn't committed yet, so we account for it manually)
        levels_passed_after_this = len(
            db.query(Approval).filter(Approval.decision_id == decision_id).all()
        ) + 1
        if levels_passed_after_this >= len(APPROVAL_LEVELS):
            decision.status = DecisionStatus.APPROVED
        else:
            decision.status = DecisionStatus.UNDER_REVIEW

    db.commit()
    db.refresh(new_approval)

    return ApprovalOut(
        id=new_approval.id,
        decision_id=new_approval.decision_id,
        reviewer_id=new_approval.reviewer_id,
        reviewer_name=current_user.name,
        outcome=new_approval.outcome,
        comments=new_approval.comments,
        reviewed_at=new_approval.reviewed_at,
    )

# Admin-only endpoint to list all approvals for a specific decision
@app.get("/decisions/{decision_id}/approvals", response_model=List[ApprovalOut])
def list_approvals(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    approvals = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.reviewed_at.asc())
        .all()
    )

    reviewer_ids = {a.reviewer_id for a in approvals}
    reviewers = db.query(User).filter(User.id.in_(reviewer_ids)).all()
    reviewer_names = {r.id: r.name for r in reviewers}

    return [
        ApprovalOut(
            id=a.id,
            decision_id=a.decision_id,
            reviewer_id=a.reviewer_id,
            reviewer_name=reviewer_names.get(a.reviewer_id, "Unknown"),
            outcome=a.outcome,
            comments=a.comments,
            reviewed_at=a.reviewed_at,
        )
        for a in approvals
    ]


# # Endpoints to get decisions relevant to the current user
# @app.get("/decisions/mine", response_model=List[DecisionOut])
# def get_my_decisions(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     return (
#         db.query(Decision)
#         .filter(Decision.created_by == current_user.id)
#         .order_by(Decision.created_at.desc())
#         .all()
#     )

# # Endpoint to get decisions that are pending review for the current user
# @app.get("/decisions/pending-review", response_model=List[DecisionOut])
# def get_pending_review_decisions(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     if current_user.role not in ("Reviewer", "Manager", "Administrator"):
#         return []  # Employees never have decisions "pending their review"

#     under_review = (
#         db.query(Decision)
#         .filter(Decision.status == DecisionStatus.UNDER_REVIEW)
#         .all()
#     )

#     # Only include decisions where it's genuinely THIS user's turn
#     pending = [
#         d for d in under_review
#         if get_next_required_role(d.id, db) == current_user.role
#     ]
#     return pending
