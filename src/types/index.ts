// src/types/index.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  justification?: string;
  timestamp: Date;
}

// You can add other shared types here
