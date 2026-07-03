from fastapi import FastAPI, Depends,HTTPException
from sqlalchemy.orm import Session
from database import Base, engine
from schemas import UserCreate, UserLogin
from models import User
from auth import hash_password, verify_password, create_access_token, get_current_user, get_db, require_admin
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

app = FastAPI()

#Root endpoint to check if the backend is running
@app.get("/")
def read_root():
    return {"message": "EDRP backend is running!"}


# @app.get("/greet/{name}")
# def greet_user(name: str):
    # return {"message": f"Hello, {name}! Welcome to EDRP."}


# Create the database tables if they don't exist
Base.metadata.create_all(bind=engine)


# User management endpoints
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),  # Hash the password before storing
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