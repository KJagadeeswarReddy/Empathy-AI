from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.models.chat_models import ChatRequest, ChatResponse, AIResponseData
from app.core.security import verify_firebase_token
from app.core.llm_manager import LLMManager
import os

router = APIRouter()
llm_manager = LLMManager()

# Check if we're in development mode
DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

# Add an explicit OPTIONS handler for preflight requests
@router.options("/send")
async def options_send():
    return Response(status_code=200)

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request_data: ChatRequest,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Endpoint to send a message to the LLM and get a response.
    Requires Firebase authentication (or mock auth in dev mode).
    """
    # Validate user ID (skip strict validation in dev mode)
    if not DEV_MODE and request_data.userId != user_data.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID in request does not match authenticated user"
        )
    
    try:
        # Convert Pydantic models to dictionaries for the LLM manager
        conversation_history = [msg.dict() for msg in request_data.conversationHistory]
        
        # Get response from LLM
        main_response, justification = await llm_manager.get_llm_response(
            conversation_history=conversation_history,
            user_message=request_data.message
        )
        
        # Construct the response
        ai_response = AIResponseData(
            content=main_response,
            justification=justification
        )
        
        return ChatResponse(aiResponse=ai_response)
        
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        ) 