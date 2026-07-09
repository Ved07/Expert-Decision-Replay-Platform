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