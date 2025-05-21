# Empathy-AI Chat Application

Empathy-AI is a web-based chat application designed to provide users with AI-driven assistance for iterative problem-solving and empathetic support. The application features a real-time chat interface, user authentication, persistent chat history, and aims to offer thoughtful and justified AI responses.

## Features

**Frontend:**
*   **User Authentication:** Secure sign-up, login, and session management using Firebase Authentication.
*   **Real-time Chat Interface:** Responsive chat UI built with Next.js and React.
*   **Persistent Chat History:** Chat sessions and messages are stored in Firebase Firestore, allowing users to revisit past conversations.
*   **Markdown Support:** Basic markdown rendering for AI responses (bold, italics, code blocks).
*   **Display AI Justifications:** Option to show/hide justifications provided by the AI for its responses.
*   **Responsive Design:** Adapts to different screen sizes.
*   **Sidebar Conversation Management:** List, select, create, rename, and delete chat sessions.
*   **Toast Notifications:** For user feedback on actions and errors.

**Backend:**
*   **AI Model Integration:** Utilizes LiteLLM to connect to various Large Language Models (configurable, with a focus on Gemini).
*   **API Endpoints:** FastAPI backend providing endpoints for chat interactions.
*   **Conversation Management:** Processes conversation history to maintain context for AI responses.
*   **System Prompt Engineering:** AI is guided by a system prompt to provide helpful and empathetic responses, including justifications.
*   **Development Mode:** Supports a mock AI response mode for development without actual API calls.
*   **Environment Variable Configuration:** For API keys, development flags, and Firebase credentials.

## Tech Stack

**Frontend:**
*   **Framework:** Next.js 14+ (with App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn/UI
*   **State Management:** React Hooks (useState, useEffect, useMemo, useCallback)
*   **Firebase:** Firebase Web SDK (Authentication, Firestore)
*   **Icons:** Lucide React
*   **Utilities:** date-fns (for date formatting), uuid (for local ID generation if needed)

**Backend:**
*   **Framework:** FastAPI
*   **Language:** Python 3.9+
*   **LLM Integration:** LiteLLM
*   **ASGI Server:** Uvicorn
*   **Firebase:** Firebase Admin SDK (for secure backend operations, if needed beyond client-side user auth context)
*   **Environment Management:** `python-dotenv` (implicitly, via environment variables)

## Project Structure

```
Empathy-AI/
├── backend/
│   ├── app/
│   │   ├── api/        # API endpoint definitions (e.g., chat)
│   │   ├── core/       # Core logic (e.g., LLMManager, config)
│   │   ├── models/     # Pydantic models for request/response
│   │   └── services/   # Business logic services (if any)
│   ├── Dockerfile
│   ├── firebase-service-account-key.json # (gitignore this in production)
│   ├── litellm_config.yaml # Configuration for LiteLLM
│   ├── requirements.txt
│   └── README.md       # Backend specific README
│
├── frontend/
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── app/        # Next.js App Router (pages, layouts)
│   │   ├── components/ # React components (UI, chat, layout)
│   │   ├── hooks/      # Custom React hooks (e.g., useAuth)
│   │   ├── lib/        # Libraries, utilities (Firebase, API service)
│   │   ├── styles/     # Global styles
│   │   └── types/      # TypeScript type definitions
│   ├── next.config.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md       # Frontend specific README
│
└── README.md           # This file (Main project README)
```

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Python (v3.9 or later recommended)
*   pip (Python package installer)
*   Firebase Project:
    *   Enable Authentication (Email/Password method)
    *   Enable Firestore Database
    *   Set up Firestore security rules (see [Firebase Setup](#firebase-setup) below)

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Empathy-AI
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment Variables
# Create a .env file in the 'backend' directory or set environment variables directly.
# Example .env contents:
# DEV_MODE=true                     # Set to 'false' for production/real API use
# USE_REAL_API_IN_DEV=false         # Set to 'true' to use real LLM APIs in dev mode (requires GOOGLE_API_KEY)
# GOOGLE_API_KEY="your_google_api_key_here" # Your Gemini API key
# GOOGLE_APPLICATION_CREDENTIALS="path/to/your/firebase-service-account-key.json" # If using Firebase Admin SDK extensively

# Firebase Admin SDK (Optional if backend doesn't heavily use Admin SDK directly for user data)
# If your backend needs to perform admin-level Firebase operations:
# 1. Go to your Firebase project settings > Service accounts.
# 2. Generate a new private key and download the JSON file.
# 3. Save it as `firebase-service-account-key.json` in the `backend` directory (ensure this file is in .gitignore).
# 4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to this file.

# LiteLLM Configuration
# Review and update `litellm_config.yaml` if you want to use different models or providers.
# Ensure your API keys (like `GOOGLE_API_KEY`) are correctly set as environment variables for LiteLLM to pick them up.
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
# yarn install

# Environment Variables
# Create a .env.local file in the 'frontend' directory.
# Example .env.local contents:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # URL of your running backend

# NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_project_web_api_key"
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_project_auth_domain"
# NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_project_storage_bucket"
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_project_messaging_sender_id"
# NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_project_app_id"
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_firebase_project_measurement_id" # Optional

# To get Firebase Web SDK config values:
# 1. Go to your Firebase project settings.
# 2. Under "Your apps", select your web app (or create one if it doesn't exist).
# 3. Find the "SDK setup and configuration" section and choose "Config".
# 4. Copy these values into your `frontend/.env.local` file, prefixed with `NEXT_PUBLIC_`.
# These are already present in `frontend/src/lib/firebase/config.ts` but should ideally be moved to environment variables for security and flexibility.
# The provided `config.ts` uses hardcoded values which is not recommended for production.
```

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
source venv/bin/activate # If not already active
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will typically run on `http://localhost:8000`.

### 2. Start the Frontend Development Server

```bash
cd frontend
npm run dev
# or
# yarn dev
```
The frontend will typically run on `http://localhost:3000`. Open this URL in your browser.

## Firebase Setup

### Authentication
Ensure Email/Password sign-in provider is enabled in your Firebase project console (Authentication > Sign-in method).

### Firestore Security Rules
For the chat application to function correctly (reading/writing chat sessions), you need to set up appropriate Firestore security rules. Navigate to Firestore Database > Rules in your Firebase console and use rules similar to this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own chat sessions
    match /users/{userId}/chatSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow users to read/write any document within their own chatSessions subcollection
    // This is a more general rule if chatSessions documents contain subcollections or complex data
    match /users/{userId}/chatSessions/{sessionId}/{document=**} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Publish these rules.

## Environment Variables Summary

**Backend (`backend/.env`):**
*   `DEV_MODE`: (`true`/`false`) Controls mock responses.
*   `USE_REAL_API_IN_DEV`: (`true`/`false`) Use real LLM in dev if `DEV_MODE` is true.
*   `GOOGLE_API_KEY`: For Gemini or other Google LLMs via LiteLLM.
*   `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase Admin SDK JSON file (optional).
*   Other LLM provider API keys as needed by `litellm_config.yaml`.

**Frontend (`frontend/.env.local`):**
*   `NEXT_PUBLIC_API_BASE_URL`: URL for the backend API.
*   `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase Web API Key.
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase Project ID.
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket.
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID.
*   `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID.
*   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID (optional).


## Known Issues & Troubleshooting
*   **Chat Flickering:** Previous issues related to chat content flickering due to state synchronization between optimistic UI updates and Firestore updates have been addressed, but ensure all components correctly handle message keys and state updates.
*   **Firebase Permissions:** Ensure your Firestore security rules are correctly set up to avoid "Missing or insufficient permissions" errors.
*   **API Key Errors:** Double-check that your `GOOGLE_API_KEY` (and any other LLM keys) are correctly set in the backend environment and accessible by LiteLLM.

## Future Enhancements (To-Do)
*   More robust error handling and display for API and network issues.
*   Streaming AI responses for better perceived performance.
*   Advanced Markdown rendering or rich text editor for messages.
*   Profile management page for users.
*   Support for multiple LLM model selection by the user.
*   Unit and integration tests.
*   Improved accessibility (ARIA attributes, keyboard navigation).
*   Option to clear individual messages.
*   Search functionality within chat history.

## Contributing
Contributions are welcome! Please follow standard fork-and-pull-request workflow. Ensure your code adheres to the existing style and that all tests pass (when applicable).

## License
This project is currently unlicensed. (Consider adding an MIT or Apache 2.0 license if it's an open-source project).
