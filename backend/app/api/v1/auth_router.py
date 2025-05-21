from fastapi import APIRouter, Depends, Response
from app.core.security import verify_firebase_token

router = APIRouter()

# Add an explicit OPTIONS handler for preflight requests
@router.options("/me")
async def options_me():
    return Response(status_code=200)

@router.get("/me")
async def get_current_user(user_data: dict = Depends(verify_firebase_token)):
    """
    Returns information about the currently authenticated user.
    This is a simple endpoint to check if authentication is working.
    """
    return {
        "uid": user_data.get("uid"),
        "email": user_data.get("email"),
        "name": user_data.get("name")
    }

# Additional auth endpoints can be added here in the future 