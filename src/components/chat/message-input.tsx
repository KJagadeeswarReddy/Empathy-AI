// src/components/chat/message-input.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react"; // PlusSquare, Eye, EyeOff removed for simplification
import type { FormEvent } from 'react';
import { useState } from "react";
// Tooltip components are not needed if icons are removed
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  // onStartNewChat?: () => void; // Prop kept if needed, but icon removed
  isLoading: boolean;
  // showJustifications: boolean; // Prop kept if needed, but icon removed
  // onToggleShowJustifications: () => void; // Prop kept if needed, but icon removed
}

export function MessageInput({ 
  onSendMessage, 
  // onStartNewChat, 
  isLoading,
  // showJustifications,
  // onToggleShowJustifications
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
      className="sticky bottom-0 z-10 flex items-center space-x-2 border-t bg-background p-3 sm:p-4" // Added sm:p-4 for slightly more padding on larger screens
    >
      {/* Icons for New Chat and Justifications were removed to simplify the input bar based on general ChatGPT aesthetic */}
      {/* {onStartNewChat && ( 
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onStartNewChat} 
                disabled={isLoading}
                aria-label="Start new chat" 
                className="text-muted-foreground hover:text-primary"
              >
                <PlusSquare className="h-5 w-5" /> 
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start New Chat</p> 
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleShowJustifications}
              disabled={isLoading}
              aria-label={showJustifications ? "Hide justifications" : "Show justifications"}
              className="text-muted-foreground hover:text-primary"
            >
              {showJustifications ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showJustifications ? "Hide Justifications" : "Show Justifications"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider> */}
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
        className="flex-1 rounded-full px-4 py-3 h-12 text-base focus-visible:ring-primary/50 shadow-sm" // Added h-12 and shadow-sm
        aria-label="Chat message input"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isLoading || !message.trim()} 
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" // Made size consistent and ensured no shrink
        aria-label="Send message"
      >
        {/* Conditional rendering for spinner inside send button removed for cleaner look, rely on disabled state */}
        <Send className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </form>
  );
}
