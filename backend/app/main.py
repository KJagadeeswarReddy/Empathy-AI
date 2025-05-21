from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import chat_router, auth_router
import os

# Check if we're in development mode
# DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"
print(f"DEBUG: DEV_MODE environment variable is: {os.environ.get('DEV_MODE')}") # For debugging

# Create FastAPI app
app = FastAPI(
    title="Empathy AI API",
    description="API for GenAI SaaS application with empathetic responses",
    version="0.1.0"
)

# Add CORS middleware
# origins = [
#     "http://localhost:3000",  
#     "http://localhost:9002",  
#     "http://localhost:9003",  
#     "http://127.0.0.1:9002", 
#     "http://127.0.0.1:9003", 
#     "http://100.115.92.206:9002", # Added your specific dev IP:port
#     "https://empathy-ai.web.app", 
#     "https://empathy-ai.firebaseapp.com", 
# ]

# FORCED PERMISSIVE CORS FOR DEBUGGING
print("DEBUG: Applying FORCED PERMISSIVE CORS settings for debugging.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Original CORS logic - Commented out for debugging
# if DEV_MODE:
#     print("DEBUG: Applying DEV_MODE CORS settings.")
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=["*"],  
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )
# else:
#     print("DEBUG: Applying PRODUCTION CORS settings.")
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=origins,
#         allow_credentials=True,
#         allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
#         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
#         expose_headers=["Content-Length"],
#         max_age=600,  
#     )

# Include routers
app.include_router(chat_router.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])

# Root endpoint for health check
@app.get("/")
async def root():
    return {"status": "healthy", "message": "Empathy AI API is running"} 