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
import { Bot, MessageCircleHeart } from 'lucide-react'; 
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


interface ChatViewProps {
  activeChatId: string | null;
  onStartNewChat: () => void; 
}

export function ChatView({ activeChatId, onStartNewChat }: ChatViewProps) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [isFetchingInitialMessage, setIsFetchingInitialMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJustifications, setShowJustifications] = useState(true); 
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
    const currentChatContext = activeChatId || 'new';
    if (initialLoadAttemptedForChat.current === currentChatContext && conversationHistory.length > 0) {
      return;
    }
    
    setConversationHistory([]); 
    setError(null);
    initialLoadAttemptedForChat.current = currentChatContext;

    if (activeChatId === null) { 
      setIsFetchingInitialMessage(true);
      generateFirstMessage({ userPrompt: "User has started a new chat." })
        .then(aiWelcomeResponse => {
          if (initialLoadAttemptedForChat.current === 'new') { 
            setConversationHistory([
              {
                id: `ai-new-${Date.now()}`,
                role: 'assistant',
                content: aiWelcomeResponse.welcomeMessage,
                timestamp: new Date(),
                justification: "Initial greeting message."
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
                justification: "Fallback initial greeting."
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
      // Placeholder: In a real app, load history for activeChatId
      // For now, we'll just clear or show a specific message for existing chats
      setConversationHistory([
        // {
        //   id: `ai-loaded-${Date.now()}`,
        //   role: 'assistant',
        //   content: `Viewing chat: ${activeChatId}. History would load here.`,
        //   timestamp: new Date(),
        //   justification: "Placeholder for loaded chat."
        // },
      ]);
    }
  }, [activeChatId, user, toast, conversationHistory.length]); // Added conversationHistory.length to help manage re-runs


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
        content: `Simulated empathetic response to: "${userInput}". Chat ID: ${activeChatId || 'New Chat'}`,
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
        <div className="container mx-auto max-w-3xl space-y-1"> 
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
            <div className="flex items-end space-x-3 py-2 justify-start">
              {/* Avatar removed for consistency */}
              <div className={("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl text-sm break-words bg-muted text-muted-foreground rounded-bl-none")}>
                  <LoadingSpinner size="sm" /> <span className="ml-2 text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <MessageInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading || isFetchingInitialMessage}
      />
      <footer className="py-3 text-center text-xs text-muted-foreground border-t bg-background max-w-3xl mx-auto w-full">
        Empathy.AI can make mistakes. Consider checking important information.
      </footer>
    </div>
  );
}
