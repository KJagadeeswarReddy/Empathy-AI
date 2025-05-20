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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, MessageCircleHeart } from 'lucide-react';

interface ChatViewProps {
  activeChatId: string | null;
  onStartNewChat: () => void;
}

export function ChatView({ activeChatId, onStartNewChat }: ChatViewProps) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For AI responses
  const [isFetchingInitialMessage, setIsFetchingInitialMessage] = useState(false); // For the very first message
  const [error, setError] = useState<string | null>(null);
  const [showJustifications, setShowJustifications] = useState(true);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initialLoadAttemptedForChat = useRef<string | null | 'new'>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [conversationHistory]);

  // Effect for handling activeChatId changes (new chat or loading existing)
  useEffect(() => {
    setConversationHistory([]); // Clear current messages when chat ID changes
    setError(null);
    initialLoadAttemptedForChat.current = activeChatId || 'new';

    if (activeChatId === null) { // New chat
      setIsFetchingInitialMessage(true);
      generateFirstMessage({ userPrompt: "User has started a new chat." })
        .then(aiWelcomeResponse => {
          setConversationHistory([
            {
              id: `ai-new-${Date.now()}`,
              role: 'assistant',
              content: aiWelcomeResponse.welcomeMessage,
              timestamp: new Date(),
            },
          ]);
        })
        .catch(err => {
          console.error("Failed to generate first message for new chat:", err);
          toast({ title: "Error", description: "Could not start new conversation.", variant: "destructive" });
          setConversationHistory([
            {
              id: `ai-fallback-new-${Date.now()}`,
              role: 'assistant',
              content: "Hello! I'm Empathy.AI. How can I help you today?",
              timestamp: new Date(),
            },
          ]);
        })
        .finally(() => {
          setIsFetchingInitialMessage(false);
        });
    } else {
      // Placeholder for loading existing chat history for activeChatId
      // For now, it will remain empty. In a real app, fetch from Firestore.
      setIsFetchingInitialMessage(false); // Not fetching a "new" first message here
       setConversationHistory([
        // {
        //   id: `ai-loaded-${Date.now()}`,
        //   role: 'assistant',
        //   content: `You are now viewing chat: ${activeChatId}. History would load here.`,
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

    // In a real app:
    // 1. If activeChatId is null, create a new chat session in Firestore, get its ID, setActiveChatId.
    // 2. Save userMessage to Firestore under activeChatId.
    // 3. Call your AI flow.
    // 4. Save AI response to Firestore.

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `This is a simulated response to: "${userInput}". I am designed to be empathetic. Current chat: ${activeChatId || 'New Chat'}`,
        justification: "This response is generated to demonstrate the chat flow.",
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
  
  // Show main loading screen if user is not yet available or initial auth is loading
  if (!user && (isLoading || isFetchingInitialMessage)) {
     return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-muted/30 h-[calc(100vh-8rem)]"> {/* Adjusted height for header/footer */}
        <Card className="w-full max-w-md p-6 sm:p-8 text-center shadow-xl rounded-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <MessageCircleHeart size={40} strokeWidth={1.5} className="sm:h-10 sm:w-10" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Preparing your chat...</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 text-sm sm:text-base">
            Empathy.AI is warming up to provide you with the best support. This won't take long!
          </CardDescription>
          <LoadingSpinner size="lg" />
        </Card>
      </div>
    );
  }
  
  // Show specific loader for the first AI message if it's a new chat and history is empty
  if (activeChatId === null && isFetchingInitialMessage && conversationHistory.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-muted/30 h-[calc(100vh-8rem)]">
         <Card className="w-full max-w-md p-6 sm:p-8 text-center shadow-xl rounded-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <MessageCircleHeart size={40} strokeWidth={1.5} className="sm:h-10 sm:w-10" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Starting your new chat...</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 text-sm sm:text-base">
            Empathy.AI is preparing a fresh start for you.
          </CardDescription>
          <LoadingSpinner size="lg" />
        </Card>
      </div>
    );
  }


  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col bg-muted/30"> {/* Adjusted height for header/footer */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="container mx-auto max-w-3xl space-y-4">
          {conversationHistory.length === 0 && !isLoading && !isFetchingInitialMessage && (
             <Card className="mt-8 text-center">
             <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot size={32} />
                </div>
               <CardTitle>
                {activeChatId === null ? "Welcome to Empathy.AI" : "Chatting"}
               </CardTitle>
               <CardDescription>
                 {activeChatId === null 
                   ? "I'm here to listen and help. Type your message below to start our conversation."
                   : "Type your message to continue this conversation."
                 }
               </CardDescription>
             </CardHeader>
           </Card>
          )}
          {conversationHistory.map((msg) => (
            <ChatMessage key={msg.id} message={msg} showJustifications={showJustifications} />
          ))}
          {isLoading && conversationHistory.length > 0 && conversationHistory[conversationHistory.length -1].role === 'user' && (
            <div className="flex items-start space-x-3 py-3 justify-start">
              <Avatar className="h-10 w-10 border bg-accent/20 text-accent">
                <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="max-w-xs md:max-w-md lg:max-w-lg">
                <Card className="rounded-2xl shadow-md bg-card text-card-foreground rounded-bl-none">
                  <CardContent className="p-3">
                    <LoadingSpinner size="sm" /> <span className="ml-2 text-sm text-muted-foreground">AI is thinking...</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <MessageInput 
        onSendMessage={handleSendMessage} 
        onStartNewChat={onStartNewChat}
        isLoading={isLoading || isFetchingInitialMessage}
        showJustifications={showJustifications}
        onToggleShowJustifications={toggleShowJustifications}
      />
    </div>
  );
}
