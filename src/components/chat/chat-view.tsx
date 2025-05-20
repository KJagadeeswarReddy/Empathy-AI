// src/components/chat/chat-view.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Message } from '@/types';
import { ChatMessage } from './chat-message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { generateFirstMessage } from '@/ai/flows/generate-first-message';
import { useToast } from '@/hooks/use-toast';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Card components removed
// import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Avatar components removed
import { Bot, MessageCircleHeart } from 'lucide-react'; // Bot for placeholder

interface ChatViewProps {
  activeChatId: string | null;
  onStartNewChat: () => void; // This prop is passed to MessageInput
}

export function ChatView({ activeChatId, onStartNewChat }: ChatViewProps) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For AI responses
  const [isFetchingInitialMessage, setIsFetchingInitialMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJustifications, setShowJustifications] = useState(false); // Default to false based on prev. simplification
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initialLoadAttemptedForChat = useRef<string | null | 'new'>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [conversationHistory]);

  useEffect(() => {
    if (initialLoadAttemptedForChat.current === (activeChatId || 'new')) {
      // If we've already attempted to load for this specific chat ID (or new chat state), don't re-fetch.
      // This helps prevent double loads caused by StrictMode or rapid state changes.
      return;
    }
    
    setConversationHistory([]); 
    setError(null);
    initialLoadAttemptedForChat.current = activeChatId || 'new';

    if (activeChatId === null) { 
      setIsFetchingInitialMessage(true);
      generateFirstMessage({ userPrompt: "User has started a new chat." })
        .then(aiWelcomeResponse => {
          if (initialLoadAttemptedForChat.current === 'new') { // Ensure this is still the active context
            setConversationHistory([
              {
                id: `ai-new-${Date.now()}`,
                role: 'assistant',
                content: aiWelcomeResponse.welcomeMessage,
                timestamp: new Date(),
              },
            ]);
          }
        })
        .catch(err => {
          console.error("Failed to generate first message for new chat:", err);
          toast({ title: "Error", description: "Could not start new conversation.", variant: "destructive" });
          if (initialLoadAttemptedForChat.current === 'new') {
            setConversationHistory([
              {
                id: `ai-fallback-new-${Date.now()}`,
                role: 'assistant',
                content: "Hello! I'm Empathy.AI. How can I help you today?",
                timestamp: new Date(),
              },
            ]);
          }
        })
        .finally(() => {
          if (initialLoadAttemptedForChat.current === 'new') {
            setIsFetchingInitialMessage(false);
          }
        });
    } else {
      setIsFetchingInitialMessage(false); 
      // Placeholder for loading existing chat. For now, it clears and shows an empty state or a message.
      setConversationHistory([
        // {
        //   id: `ai-loaded-${Date.now()}`,
        //   role: 'assistant',
        //   content: `Viewing chat: ${activeChatId}. History would load here.`,
        //   timestamp: new Date(),
        // },
      ]);
    }
  }, [activeChatId, user, toast]);


  const handleSendMessage = async (userInput: string) => {
    if (!user) {
      setError("User not authenticated.");
      toast({ title: "Authentication Error", description: "Please log in to chat.", variant: "destructive"});
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setConversationHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Simulated empathetic response to: "${userInput}". Chat: ${activeChatId || 'New Chat'}`,
        justification: "This response is generated to demonstrate the chat flow and empathy.",
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      console.error("Failed to get AI response:", err);
      setError(err.message || "Failed to get response from AI.");
      toast({
        title: "Chat Error",
        description: err.message || "Failed to get response from AI.",
        variant: "destructive",
      });
      const errorResponseMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error trying to respond. Please try again.",
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowJustifications = () => {
    setShowJustifications(prev => !prev);
  };
  
  if (!user && (isLoading || isFetchingInitialMessage)) {
     return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-background h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md p-6 sm:p-8 text-center rounded-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <MessageCircleHeart size={40} strokeWidth={1.5} className="sm:h-10 sm:w-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Preparing your chat...</h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Empathy.AI is warming up. This won't take long!
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (activeChatId === null && isFetchingInitialMessage && conversationHistory.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-background h-[calc(100vh-8rem)]">
         <div className="w-full max-w-md p-6 sm:p-8 text-center rounded-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <MessageCircleHeart size={40} strokeWidth={1.5} className="sm:h-10 sm:w-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Starting your new chat...</h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Empathy.AI is preparing a fresh start for you.
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="container mx-auto max-w-3xl space-y-1"> {/* Reduced space-y for tighter message packing */}
          {conversationHistory.length === 0 && !isLoading && !isFetchingInitialMessage && (
            <div className="mt-8 text-center py-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot size={32} />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeChatId === null ? "Welcome to Empathy.AI" : "Chat Ready"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {activeChatId === null 
                  ? "I'm here to listen and help. Type your message below to start our conversation."
                  : "Type your message to continue this conversation."
                }
              </p>
            </div>
          )}
          {conversationHistory.map((msg) => (
            <ChatMessage key={msg.id} message={msg} showJustifications={showJustifications} />
          ))}
          {isLoading && conversationHistory.length > 0 && conversationHistory[conversationHistory.length -1].role === 'user' && (
            <div className="flex items-start space-x-3 py-3 justify-start">
              {/* Avatar removed for AI thinking, consistent with message styling */}
              <div className="max-w-xs md:max-w-md lg:max-w-lg">
                <div className="p-3 rounded-2xl rounded-bl-none bg-muted text-muted-foreground">
                  <LoadingSpinner size="sm" /> <span className="ml-2 text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <MessageInput 
        onSendMessage={handleSendMessage} 
        // onStartNewChat prop is available if MessageInput needs it, but icons were removed for simplicity
        isLoading={isLoading || isFetchingInitialMessage}
        // showJustifications={showJustifications} // Icon was removed
        // onToggleShowJustifications={toggleShowJustifications} // Icon was removed
      />
      <footer className="py-3 text-center text-xs text-muted-foreground border-t bg-background">
        Empathy.AI can make mistakes. Consider checking important information.
      </footer>
    </div>
  );
}
