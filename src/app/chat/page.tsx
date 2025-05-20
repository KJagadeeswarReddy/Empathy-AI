// src/app/chat/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthenticatedPageLayout } from '@/components/layout/authenticated-page-layout';
import { ChatView } from '@/components/chat/chat-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ChatSession } from '@/types';
import { 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, // If needed
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger, // For desktop header
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bot, Edit3, MessageSquarePlus, PlusSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Mock chat sessions for now
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    { id: 'chat1', title: 'My first chat about dogs', lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 'chat2', title: 'Recipe ideas for dinner', lastActivity: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 'chat3', title: 'Planning weekend trip', lastActivity: new Date() },
  ]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    // In a real app, you'd load conversation history for this chatId here
  };

  const handleNewChat = () => {
    setActiveChatId(null); 
    // Potentially create a new chat session placeholder here or wait for first message
  };
  
  const handleDeleteChat = (chatId: string) => {
    // Todo: Implement chat deletion from Firestore
    setChatSessions(prev => prev.filter(session => session.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null); // Or select next available chat
    }
    // Add toast notification for deletion
  };


  const sidebarComponentContent = useMemo(() => (
    <>
      <SidebarHeader className="p-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold px-2 group-data-[collapsible=icon]:hidden">Conversations</h2>
        <div className="flex items-center">
          {/* This SidebarTrigger is for desktop, within the sidebar header */}
          <SidebarTrigger className="hidden md:flex" /> 
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        {/* This div and its content will be hidden when collapsed */}
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <Button 
            variant="outline" 
            className="w-full justify-start" // Removed icon-specific classes as the parent div handles hiding
            onClick={handleNewChat}
          >
            <MessageSquarePlus className="mr-2" />
            <span>New Chat</span>
          </Button>
        </div>
        {/* This ScrollArea and its content will be hidden when collapsed */}
        <ScrollArea className="h-[calc(100%-4rem)] group-data-[collapsible=icon]:hidden">
          <SidebarMenu className="px-2">
            {chatSessions.sort((a,b) => b.lastActivity.getTime() - a.lastActivity.getTime()).map((session) => (
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton
                  onClick={() => handleSelectChat(session.id)}
                  isActive={activeChatId === session.id}
                  className="w-full justify-between text-left h-auto py-2"
                  tooltip={{content: session.title || `Chat ${session.id}`, side: "right"}}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{session.title || `Chat ${session.id}`}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(session.lastActivity, { addSuffix: true })}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             {chatSessions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                No past conversations yet. Start a new one!
              </div>
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      {/* <SidebarFooter>...</SidebarFooter> */}
    </>
  ), [chatSessions, activeChatId, handleNewChat, handleSelectChat]);


  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <AuthenticatedPageLayout title="Empathy.AI Chat" sidebarComponent={sidebarComponentContent}>
      <ChatView 
        key={activeChatId || 'new-chat'} 
        activeChatId={activeChatId}
        onStartNewChat={handleNewChat} 
      />
    </AuthenticatedPageLayout>
  );
}

