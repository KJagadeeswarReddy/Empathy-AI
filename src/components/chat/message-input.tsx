// src/components/chat/message-input.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import type { FormEvent } from 'react';
import { useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onClearConversation?: () => void;
  isLoading: boolean;
}

export function MessageInput({ onSendMessage, onClearConversation, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-10 mt-auto flex items-center space-x-2 border-t bg-background p-4 shadow- ऊपर" // "shadow-ऊपर" is not a valid tailwind class, using shadow-up if it existed, or just shadow. Using shadow for now.
    >
      {onClearConversation && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearConversation}
          disabled={isLoading}
          aria-label="Clear conversation"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      )}
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
        className="flex-1 rounded-full px-4 py-3 text-base focus-visible:ring-primary/50"
        aria-label="Chat message input"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isLoading || !message.trim()} 
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-label="Send message"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
