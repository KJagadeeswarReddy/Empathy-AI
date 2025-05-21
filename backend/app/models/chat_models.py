from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    justification: Optional[str] = None  # For assistant messages from history

class ChatRequest(BaseModel):
    userId: str  # From Firebase decoded token
    conversationHistory: List[ChatMessage]
    message: str  # The new user message

class AIResponseData(BaseModel):
    role: str = "assistant"
    content: str
    justification: Optional[str] = None

class ChatResponse(BaseModel):
    aiResponse: AIResponseData
    # conversationId: Optional[str] = None  # For future use 