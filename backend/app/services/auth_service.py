import os
import hmac
import hashlib
import base64
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import User

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_upi_fraud_guard_production_key_98437298")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

security_scheme = HTTPBearer(auto_error=False)


# Reliable password hashing using salted SHA-256 + PBKDF2 (zero external binary dependency issues)
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return base64.b64encode(salt + key).decode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        decoded = base64.b64decode(hashed_password.encode("ascii"))
        salt = decoded[:16]
        stored_key = decoded[16:]
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key, stored_key)
    except Exception:
        # Fallback for plain bcrypt if used
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        **to_encode,
        "exp": int(expire.timestamp()),
        "iat": int(datetime.utcnow().timestamp())
    }
    
    def b64url(s_bytes: bytes) -> str:
        return base64.urlsafe_b64encode(s_bytes).decode("ascii").rstrip("=")
    
    hdr_b64 = b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{hdr_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = b64url(signature)
    return f"{hdr_b64}.{payload_b64}.{sig_b64}"


def decode_token(token: str) -> Dict[str, Any]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")
        hdr_b64, payload_b64, sig_b64 = parts
        
        signing_input = f"{hdr_b64}.{payload_b64}".encode("ascii")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        
        # Base64url padding
        padding = "=" * ((4 - len(sig_b64) % 4) % 4)
        received_sig = base64.urlsafe_b64decode(sig_b64 + padding)
        
        if not hmac.compare_digest(expected_sig, received_sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")
            
        payload_padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64 + payload_padding).decode("utf-8")
        payload = json.loads(payload_json)
        
        if "exp" in payload and payload["exp"] < time.time():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
            
        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token validation failed: {str(e)}")


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )
    payload = decode_token(auth.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token credentials")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required for this action."
        )
    return current_user
