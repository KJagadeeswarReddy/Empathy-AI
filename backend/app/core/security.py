import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..core.config import settings
import os

# Flag to determine if we're in development mode
DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

# Initialize Firebase Admin SDK
firebase_initialized = False
try:
    cred = credentials.Certificate(settings.FIREBASE_ADMIN_SDK_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    firebase_initialized = True
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    print("Falling back to development mode authentication")
    # We'll handle this by using mock authentication in development mode

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)  # auto_error=False allows None value

async def verify_firebase_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Verifies a Firebase ID token and returns the decoded token if valid.
    In development mode, it will return a mock user if token verification fails.
    """
    # For development without a valid token
    if not firebase_initialized or DEV_MODE:
        if token is None or token == "dev-mode":
            print("Using development mode authentication")
            return {
                "uid": "dev-user-123",
                "email": "dev@example.com",
                "name": "Development User"
            }
    
    # Regular Firebase token verification
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please reauthenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        if DEV_MODE:
            print("Invalid token but in DEV_MODE - using mock user")
            return {
                "uid": "dev-user-123",
                "email": "dev@example.com",
                "name": "Development User"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token. Please reauthenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        if DEV_MODE:
            print(f"Authentication error in DEV_MODE: {str(e)} - using mock user")
            return {
                "uid": "dev-user-123",
                "email": "dev@example.com",
                "name": "Development User"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) 