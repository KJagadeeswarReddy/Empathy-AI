from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()  # Load .env file

class Settings(BaseSettings):
    FIREBASE_ADMIN_SDK_CREDENTIALS_PATH: str = os.getenv("FIREBASE_ADMIN_SDK_CREDENTIALS_PATH", "path/to/your/serviceAccountKey.json")
    # Add other global settings if needed
    # LiteLLM API keys are often set as environment variables directly for LiteLLM to pick up.
    # Example: OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")

settings = Settings() 