from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import User, AuditLog
from backend.app.schemas.schemas import UserCreate, UserLogin, UserOut, TokenResponse
from backend.app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Hash password & create user
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role if user_in.role in ["admin", "analyst"] else "analyst",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="USER_REGISTERED",
        resource="users",
        details={"role": new_user.role}
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact system administrator."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        resource="auth",
        details={"role": user.role}
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/demo-login/{role}", response_model=TokenResponse)
def demo_login(role: str, db: Session = Depends(get_db)):
    """One-click demo login for Admin or Analyst roles for easy hackathon and testing."""
    role = role.lower()
    if role not in ["admin", "analyst"]:
        role = "analyst"

    demo_email = f"{role}@fraudguard.ai"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        # Create default demo user on the fly if not yet seeded
        full_name = "Lead Risk Analyst" if role == "analyst" else "Security Administrator"
        user = User(
            email=demo_email,
            full_name=full_name,
            hashed_password=hash_password(f"{role.capitalize()}@123"),
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
