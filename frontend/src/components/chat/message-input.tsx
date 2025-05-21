// src/components/chat/message-input.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showJustifications: boolean;
  onToggleJustifications: () => void;
  currentMessageCount: number;
}

export function MessageInput({
  onSendMessage,
  isLoading,
  showJustifications,
  onToggleJustifications,
  currentMessageCount,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading, currentMessageCount]);

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 flex w-full items-center space-x-2 border-t bg-background p-4 sm:p-3 md:p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" onClick={onToggleJustifications} className="shrink-0">
            {showJustifications ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="sr-only">{showJustifications ? "Hide Justifications" : "Show Justifications"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showJustifications ? "Hide AI Justifications" : "Show AI Justifications"}</p>
        </TooltipContent>
      </Tooltip>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="max-h-32 min-h-[40px] flex-1 resize-none overflow-y-auto rounded-2xl border border-input bg-card p-2.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 dark:bg-card"
        rows={1}
        disabled={isLoading}
      />
      <Button type="submit" size="icon" disabled={isLoading || !message.trim()} className="shrink-0 rounded-full">
        <SendHorizontal className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
