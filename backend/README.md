# Empathy AI Backend

This is the backend API for the Empathy AI application, a GenAI SaaS that provides empathetic and helpful AI responses.

## Technology Stack

- Python 3.9+
- FastAPI
- LiteLLM (for interacting with various LLM providers)
- Firebase Admin SDK (for authentication)

## Setup

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Firebase credentials path and LLM API keys.

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker

To build and run using Docker:

```bash
# Build the image
docker build -t empathy-ai-backend .

# Run the container
docker run -p 8000:8000 --env-file .env empathy-ai-backend
```

## Features

- Firebase authentication
- Chat functionality with LLM integration
- Support for multiple LLM providers through LiteLLM
- Empathetic AI responses with justifications 