from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import hash_password, verify_password, create_access_token, get_db
from models import User
from schemas import UserCreate
from helpers import send_email

router = APIRouter(tags=["Authentication"])

@router.post(
    "/users",
    summary="Register a new user",
    description="Create a new account for a user in the EDRP system using a validated email and password.",
    response_description="User account created successfully.",
    status_code=201,
)
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

    # Welcome email — fires in background, never blocks the response
    send_email(
        to_email=new_user.email,
        subject="Welcome to EDRP — Expert Decision Replay Platform",
        body=(
            f"Hi {new_user.name},\n\n"
            "Welcome to the Expert Decision Replay Platform (EDRP)!\n\n"
            "Your account has been successfully created. You can now log in and start "
            "recording, reviewing, and replaying decisions with your team.\n\n"
            "If you have any questions, please reach out to your administrator.\n\n"
            "Best regards,\n"
            "The EDRP Team"
        ),
    )

    return new_user

@router.post(
    "/login",
    summary="Authenticate a user",
    description="Validate user credentials and return a signed JWT bearer token for authenticated API calls.",
    response_description="Authentication token returned successfully.",
    status_code=200,
)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
