from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth import hash_password, verify_password, create_token

router = APIRouter()


@router.post("/signup")
def signup(username: str, password: str, db: Session = Depends(get_db)):
    user = User(username=username, password=hash_password(password))
    db.add(user)
    db.commit()

    return {"message": "User created"}


@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()

    if not user or not verify_password(password, user.password):
        return {"error": "Invalid credentials"}

    token = create_token({"sub": user.username})

    return {"access_token": token}