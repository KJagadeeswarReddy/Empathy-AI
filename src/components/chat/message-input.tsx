// src/components/chat/message-input.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { FormEvent } from 'react';
import { useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  isLoading,
}: MessageInputProps) {
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
      className="sticky bottom-0 z-10 flex items-center space-x-2 border-t bg-background p-3 sm:p-4 max-w-3xl mx-auto w-full"
    >
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
        className="flex-1 rounded-full px-4 py-3 h-12 text-base focus-visible:ring-primary/50 shadow-sm"
        aria-label="Chat message input"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isLoading || !message.trim()} 
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
        aria-label="Send message"
      >
        <Send className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </form>
  );
}
