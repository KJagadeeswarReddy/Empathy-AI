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
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

const API_ENDPOINT = '/api/v1/chat/send'; // Placeholder for your backend API

export function ChatView() {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      if (user && conversationHistory.length === 0) {
        setIsLoading(true);
        try {
          // Call the GenAI flow for the first message
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
          setIsLoading(false);
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
    setIsLoading(true);
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
      // Simulate API call
      // const response = await fetch(API_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) {
      //   throw new Error(`API error: ${response.statusText}`);
      // }
      // const data = await response.json();
      // const aiResponse: Message = {
      //   id: `ai-${Date.now()}`,
      //   role: 'assistant',
      //   content: data.aiResponse.content,
      //   justification: data.aiResponse.justification,
      //   timestamp: new Date(),
      // };

      // Mocked AI Response
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
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
      // Optionally add an error message to chat
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

  const handleClearConversation = async () => {
    setConversationHistory([]);
    // Optionally, call generateFirstMessage again
    setIsLoading(true);
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
      setConversationHistory([ // Fallback message
        {
          id: `ai-fallback-${Date.now()}`,
          role: 'assistant',
          content: "Hello again! How can I assist you now?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="ml-2">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/30"> {/* Adjust height based on header */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="container mx-auto max-w-3xl space-y-4">
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
