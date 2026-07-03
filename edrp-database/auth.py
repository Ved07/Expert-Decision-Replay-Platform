import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from jose import JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User


def hash_password(plain_password: str) -> str:
    # bcrypt works with bytes, not strings, so we encode first
    password_bytes = plain_password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    # store it as a normal string in the database
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)



# In a real project this comes from an environment variable, never hardcoded.
# For now, just use any long random string.
SECRET_KEY = "change-this-to-something-random-later"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # token valid for 24 hours


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# This tells FastAPI: "expect a token in the Authorization header,
# and show a 'Authorize' button in /docs for it."
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_error

    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can perform this action",
        )
    return current_user