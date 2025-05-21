import type { Message } from '@/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Simplified message format for API requests
export interface ApiMessage {
  role: string;
  content: string;
  justification?: string;
}

export interface ChatRequest {
  userId: string;
  conversationHistory: ApiMessage[];
  message: string;
}

export interface ChatResponse {
  aiResponse: {
    role: string;
    content: string;
    justification?: string;
  };
}

/**
 * Send a message to the AI through our backend API
 */
export async function sendMessage(request: ChatRequest, idToken: string | null): Promise<ChatResponse> {
  if (!idToken) {
    // This case should ideally be handled before calling sendMessage,
    // e.g., by redirecting to login if no user/token is available.
    throw new Error("Authentication token not available. Please log in.");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}` // Use the real ID token
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An unexpected API error occurred." }));
    // Use errorData.detail if FastAPI provides it, otherwise a generic message.
    throw new Error(errorData.detail || errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
} 