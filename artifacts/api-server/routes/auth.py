from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
from auth_utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    department: str

class LoginRequest(BaseModel):
    email: str
    password: str

def fmt_user(u):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "createdAt": u.created_at.isoformat() if u.created_at else "",
    }

@router.post("/auth/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(400, detail="Email already registered")
    user = models.User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        department=body.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id, user.role, user.department), "user": fmt_user(user)}

@router.post("/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, detail="Invalid email or password")
    return {"token": create_token(user.id, user.role, user.department), "user": fmt_user(user)}

@router.get("/auth/me")
def me(current_user: models.User = Depends(get_current_user)):
    return fmt_user(current_user)
