// src/components/chat/chat-view.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Message } from '@/types';
import { ChatMessage } from './chat-message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { generateFirstMessage } from '@/ai/flows/generate-first-message'; // Import the GenAI flow
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, MessageCircleHeart } from 'lucide-react';

const API_ENDPOINT = '/api/v1/chat/send'; // Placeholder for your backend API

export function ChatView() {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); // This is for ChatView's internal loading (e.g., AI responding)
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [conversationHistory]);

  // Generate initial AI message if conversation is empty
  useEffect(() => {
    const initChat = async () => {
      // user object is guaranteed to be present here because ChatPage handles the !user case
      if (user && conversationHistory.length === 0) {
        setIsLoading(true); // Indicate ChatView is loading the first message
        try {
          const firstMessageInput = { userPrompt: "User has just opened a new chat." };
          const aiWelcomeResponse = await generateFirstMessage(firstMessageInput);
          
          setConversationHistory((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: aiWelcomeResponse.welcomeMessage,
              timestamp: new Date(),
            },
          ]);
        } catch (err) {
          console.error("Failed to generate first message:", err);
          toast({
            title: "Error",
            description: "Could not start conversation with AI.",
            variant: "destructive",
          });
           setConversationHistory((prev) => [ // Fallback message
            ...prev,
            {
              id: `ai-fallback-${Date.now()}`,
              role: 'assistant',
              content: "Hello! I'm Empathy.AI. How can I help you today?",
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsLoading(false); // Done loading first message
        }
      }
    };
    initChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Runs when user context is available and conversation is new

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
    setIsLoading(true); // AI is now thinking for a response to user's message
    setError(null);

    const payload = {
      userId: user.uid,
      conversationHistory: [...conversationHistory, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
        justification: msg.justification
      })),
      message: userInput,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `This is a simulated response to: "${userInput}". I am designed to be empathetic.`,
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
      setIsLoading(false); // AI done thinking
    }
  };

  const handleClearConversation = async () => {
    setConversationHistory([]);
    setIsLoading(true); // Preparing new first message
    try {
      const firstMessageInput = { userPrompt: "User has cleared the conversation and started fresh." };
      const aiWelcomeResponse = await generateFirstMessage(firstMessageInput);
      setConversationHistory([
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiWelcomeResponse.welcomeMessage,
          timestamp: new Date(),
        },
      ]);
       toast({
        title: "Conversation Cleared",
        description: "A new chat has started.",
      });
    } catch (err) {
      console.error("Failed to generate first message after clear:", err);
      setConversationHistory([ 
        {
          id: `ai-fallback-${Date.now()}`,
          role: 'assistant',
          content: "Hello again! How can I assist you now?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false); // Done with new first message
    }
  };

  // The ChatPage component handles the case where !user or auth is initially loading.
  // So, by the time ChatView renders, 'user' should be available.

  // NEW: Loading state for initial AI message generation
  if (isLoading && conversationHistory.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-muted/30 h-[calc(100vh-4rem)]">
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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/30">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="container mx-auto max-w-3xl space-y-4">
          {/* Fallback welcome card: shows if initChat fails AND history is still empty AND not loading */}
          {conversationHistory.length === 0 && !isLoading && (
             <Card className="mt-8 text-center">
             <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot size={32} />
                </div>
               <CardTitle>Welcome to Empathy.AI</CardTitle>
               <CardDescription>
                 I'm here to listen and help. Type your message below to start our conversation.
               </CardDescription>
             </CardHeader>
           </Card>
          )}
          {conversationHistory.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {/* Spinner for AI responding to user's subsequent messages */}
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
      <MessageInput onSendMessage={handleSendMessage} onClearConversation={handleClearConversation} isLoading={isLoading} />
    </div>
  );
}
