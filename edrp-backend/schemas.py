from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TeamCreate(BaseModel):
    name: str
    manager_id: int | None = None


class TeamOut(BaseModel):
    id: int
    name: str
    manager_id: int | None

    class Config:
        from_attributes = True