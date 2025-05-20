// src/types/index.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  justification?: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  lastActivity: Date;
  // Later, we might add a snippet of the last message or unread count
}

// You can add other shared types here
