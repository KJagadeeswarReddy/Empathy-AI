// src/components/chat/chat-view.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '@/types';
import { ChatMessage } from './chat-message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Bot, MessageCircleHeart } from 'lucide-react';
import { sendMessage, ApiMessage } from '@/lib/api-service';

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

export interface ChatViewProps {
  chatSessionId: string | null;
  initialMessages: Message[];
  onMessagesUpdate: (messages: Message[], newTitle?: string) => void;
}

interface GreetingFetchState {
  sessionId: string | null;
  fetched: boolean;
}

export function ChatView({ chatSessionId, initialMessages, onMessagesUpdate }: ChatViewProps) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJustifications, setShowJustifications] = useState(true);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const greetingFetchStateRef = useRef<GreetingFetchState>({ sessionId: null, fetched: false });

  // Scroll to bottom when conversation history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [conversationHistory]);

  // Effect to fetch initial greeting for a new, empty chat session.
  // Relies on ChatView being remounted (via key prop) when chatSessionId changes,
  // which correctly initializes conversationHistory via useState(initialMessages).
  useEffect(() => {
    if (chatSessionId !== greetingFetchStateRef.current.sessionId) {
      // If chatSessionId has changed, reset greeting fetch status for the new/switched session.
      greetingFetchStateRef.current = { sessionId: chatSessionId, fetched: false };
    }

    // Fetch greeting only if: it's a valid chat session, it's empty, greeting hasn't been fetched yet for this session, and user is available.
    if (chatSessionId && initialMessages.length === 0 && !greetingFetchStateRef.current.fetched && user) {
      setIsLoading(true); 
      greetingFetchStateRef.current = { sessionId: chatSessionId, fetched: true }; 

      user.getIdToken().then(token => {
        sendMessage({
          userId: user.uid, 
          conversationHistory: [], 
          message: "User has started a new chat session.", 
        }, token)
          .then(response => {
            const initialAiMessage: Message = {
              id: `ai-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'assistant',
              content: response.aiResponse.content,
              timestamp: new Date(),
              justification: response.aiResponse.justification,
            };
            // This update to conversationHistory will be picked up by the useEffect below to call onMessagesUpdate.
            setConversationHistory([initialAiMessage]);
          })
          .catch(err => {
            console.error("Failed to generate first message for new chat:", err);
            toast({ title: "Error fetching initial message", description: err.message || "Could not start conversation.", variant: "destructive" });
            const fallbackMessage: Message = {
              id: `ai-fallback-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'assistant',
              content: "Hello! I'm Empathy.AI. How can I help you today?",
              timestamp: new Date(),
              justification: "Fallback initial greeting."
            };
            setConversationHistory([fallbackMessage]);
            if (chatSessionId === greetingFetchStateRef.current.sessionId) { 
              greetingFetchStateRef.current.fetched = false; // Allow retry for this session if it failed
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }).catch(tokenError => {
        console.error("Error getting ID token for initial message:", tokenError);
        toast({ title: "Authentication Error", description: "Could not authenticate for chat. Please try logging in again.", variant: "destructive" });
        setIsLoading(false);
        if (chatSessionId === greetingFetchStateRef.current.sessionId) { 
           greetingFetchStateRef.current.fetched = false; // Allow retry
        }
      });
    } else if (chatSessionId && initialMessages.length > 0 && greetingFetchStateRef.current.sessionId === chatSessionId && !greetingFetchStateRef.current.fetched) {
      // If messages were already loaded from parent (e.g. existing chat), mark greeting as "fetched" to prevent trying again.
      greetingFetchStateRef.current.fetched = true;
    }
  }, [chatSessionId, initialMessages, user, toast]); // initialMessages is still needed to trigger for empty chats.

  // Update parent (ChatPage) when conversationHistory changes internally in ChatView.
  // This is critical for persisting messages.
  useEffect(() => {
    // Only call onMessagesUpdate if conversationHistory has genuinely changed 
    // from what was last received via initialMessages or from its own previous state.
    // The comparison with initialMessages helps prevent loops if initialMessages itself caused this effect to run.
    if (JSON.stringify(conversationHistory) !== JSON.stringify(initialMessages)) {
      // Parent (ChatPage) handles title generation logic.
      onMessagesUpdate(conversationHistory, undefined);
    }
  }, [conversationHistory, initialMessages, onMessagesUpdate]);

  const convertToApiMessages = (messages: Message[]): ApiMessage[] => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  };

  const handleSendMessage = async (userInput: string) => {
    if (!user) {
      // setError("User not authenticated."); // setError is not used, relying on toast
      toast({ title: "Authentication Error", description: "Please log in to chat.", variant: "destructive"});
      return;
    }
    if (!chatSessionId) {
      // setError("No active chat session.");
      toast({ title: "Chat Error", description: "No active chat session found.", variant: "destructive"});
      return;
    }

    setIsLoading(true); 
    // setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    // Optimistically add user message.
    // The useEffect listening to conversationHistory will then call onMessagesUpdate.
    const currentHistoryWithUserMessage = [...conversationHistory, userMessage];
    setConversationHistory(currentHistoryWithUserMessage);
    
    // Prepare history for API *before* adding the current user's new message (if API expects that)
    // Or, send history *including* the new user message if API needs it to provide context for AI.
    // Current implementation of convertToApiMessages does not include justification, so it's fine for history.
    // The API call itself uses `userInput` for the new message, and `conversationHistory` for the preceding messages.
    // So, we should pass the conversationHistory *before* adding the new userMessage to it.
    const apiHistory = convertToApiMessages(conversationHistory); // History *before* current userMessage

    try {
      const token = await user.getIdToken();
      if (!token) {
        toast({ title: "Authentication Error", description: "Could not retrieve auth token. Please re-login.", variant: "destructive" });
        setIsLoading(false);
        // Revert optimistic user message addition if auth fails before sending?
        // For now, it stays, and user might need to resend or refresh.
        return;
      }

      const response = await sendMessage({
        userId: user.uid, 
        conversationHistory: apiHistory, // Pass the history *before* the current user's message
        message: userInput
      }, token);

      const aiResponse: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.aiResponse.content,
        justification: response.aiResponse.justification,
        timestamp: new Date(),
      };
      // Add AI response. The useEffect on conversationHistory will sync this to parent.
      setConversationHistory([...currentHistoryWithUserMessage, aiResponse]);
    } catch (err: any) {
      console.error("Failed to get AI response:", err);
      if (err.message && err.message.toLowerCase().includes("auth")) {
        toast({ /* ... auth error ... */ });
      } else {
        toast({ /* ... chat error ... */ });
      }
      const errorResponseMessage: Message = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: "Sorry, I encountered an error trying to respond. Please try again.",
        timestamp: new Date(),
      };
      // Add error message. useEffect on conversationHistory will sync.
      setConversationHistory([...currentHistoryWithUserMessage, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowJustifications = () => {
    setShowJustifications(prev => !prev);
  };

  // Loading state specifically for the initial greeting fetch on a new, empty chat
  if (chatSessionId && initialMessages.length === 0 && isLoading && conversationHistory.length === 0) {
    // This condition implies we are fetching the initial greeting (isLoading is true from that specific logic)
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
    <TooltipProvider>
      <div className="flex h-[calc(100vh-8rem)] flex-col bg-background">
        <ScrollArea className="flex-1 px-4 pt-4 pb-0" ref={scrollAreaRef}>
          <div className="container mx-auto max-w-3xl space-y-1">
            {/* Displayed messages are from conversationHistory state */}
            {conversationHistory.length === 0 && !isLoading && (
              <div className="mt-8 text-center py-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot size={32} />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {chatSessionId ? "Chat Ready" : "Welcome to Empathy.AI"} 
                </h2>
                <p className="text-muted-foreground mt-2">
                  {chatSessionId
                    ? "Type your message to continue this conversation or start a new one."
                    : "Select or start a new chat to begin."}
                </p>
              </div>
            )}
            {conversationHistory.map((msg) => (
              <ChatMessage key={msg.id} message={msg} showJustifications={showJustifications} />
            ))}
            {isLoading && conversationHistory.length > 0 && conversationHistory[conversationHistory.length -1].role === 'user' && (
              // This is the "AI is thinking..." indicator
              <div className="flex items-end space-x-3 py-2 justify-start">
                 <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full mr-2 bg-primary/10 items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className={("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl text-sm break-words bg-muted text-muted-foreground rounded-bl-none")}>
                    <LoadingSpinner size="sm" /> <span className="ml-2 text-xs italic">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="px-4 pb-2 pt-2 max-w-2xl w-full mx-auto"> 
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            showJustifications={showJustifications}
            onToggleJustifications={toggleShowJustifications}
            currentMessageCount={conversationHistory.length}
          />
          <p className="text-xs text-muted-foreground text-center mt-2 px-2">
            Empathy.AI may provide inaccurate information. Please double-check important information.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
