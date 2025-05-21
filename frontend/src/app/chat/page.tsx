// src/app/chat/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthenticatedPageLayout } from '@/components/layout/authenticated-page-layout';
import { ChatView } from '@/components/chat/chat-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ChatSession, Message } from '@/types';
import { 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Bot, MessageSquarePlus, Trash2, Edit, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';

import { firestore } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Helper to convert Firestore Timestamps in messages to Date objects
const convertMessageTimestamps = (messages: any[]): Message[] => {
  return messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now()),
  }));
};

// Helper to prepare messages for Firestore (convert Date to Timestamp)
const prepareMessagesForFirestore = (messages: Message[]): any[] => {
  return messages.map(msg => ({
    ...msg,
    // Convert Date back to Timestamp if it's a Date object
    timestamp: msg.timestamp instanceof Date ? Timestamp.fromDate(msg.timestamp) : msg.timestamp,
  }));
};

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // State for rename dialog
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setIsLoadingSessions(true);
      const chatSessionsCol = collection(firestore, 'users', user.uid, 'chatSessions');
      const q = query(chatSessionsCol, orderBy('lastActivity', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions: ChatSession[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title,
            messages: data.messages ? convertMessageTimestamps(data.messages) : [],
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            lastActivity: data.lastActivity instanceof Timestamp ? data.lastActivity.toDate() : new Date(),
            userId: data.userId,
          } as ChatSession;
        });
        setChatSessions(sessions);
        
        if (sessions.length > 0 && (!activeChatId || !sessions.find(s => s.id === activeChatId))) {
          setActiveChatId(sessions[0].id);
        } else if (sessions.length === 0) {
          setActiveChatId(null);
        }
        setIsLoadingSessions(false);
      }, (error) => {
        console.error("Error fetching chat sessions:", error);
        toast({ title: "Error", description: "Could not load chat sessions.", variant: "destructive"});
        setIsLoadingSessions(false);
      });

      return () => unsubscribe();
    } else {
      setChatSessions([]);
      setActiveChatId(null);
      setIsLoadingSessions(false);
    }
  }, [user, toast, activeChatId]);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a new chat.", variant: "destructive"});
      return;
    }
    const newChatData = {
      title: 'New Chat',
      messages: [],
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      userId: user.uid,
    };
    try {
      const chatSessionsCol = collection(firestore, 'users', user.uid, 'chatSessions');
      const docRef = await addDoc(chatSessionsCol, newChatData);
      toast({ title: "Chat Created", description: "New chat started.", variant: "default"});
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({ title: "Error", description: "Could not create new chat.", variant: "destructive"});
    }
  }, [user, toast]);
  
  const openDeleteDialog = (session: ChatSession) => {
    setChatToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (chatToDelete && user) {
      try {
        const chatDocRef = doc(firestore, 'users', user.uid, 'chatSessions', chatToDelete.id);
        await deleteDoc(chatDocRef);
        
        setChatToDelete(null); 
        toast({ title: "Chat Deleted", description: `"${chatToDelete.title}" was deleted.`, variant: "default"});
      } catch (error) {
        console.error("Error deleting chat:", error);
        toast({ title: "Error", description: "Could not delete chat.", variant: "destructive"});
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const openRenameDialog = (session: ChatSession) => {
    setChatToRename(session);
    setNewChatTitle(session.title);
    setIsRenameDialogOpen(true);
  };

  const confirmRenameChat = async () => {
    if (chatToRename && newChatTitle.trim() !== '' && user) {
      try {
        const chatDocRef = doc(firestore, 'users', user.uid, 'chatSessions', chatToRename.id);
        await updateDoc(chatDocRef, {
          title: newChatTitle.trim(),
          lastActivity: serverTimestamp(),
        });
        setChatToRename(null);
        setNewChatTitle('');
        toast({ title: "Chat Renamed", description: "Chat title updated.", variant: "default"});
      } catch (error) {
        console.error("Error renaming chat:", error);
        toast({ title: "Error", description: "Could not rename chat.", variant: "destructive"});
      }
    }
    setIsRenameDialogOpen(false);
  };

  const handleUpdateMessagesInSession = useCallback(async (chatId: string, newMessages: Message[], suggestedNewTitle?: string) => {
    if (!user || !chatId) return;

    const currentSession = chatSessions.find(s => s.id === chatId);
    if (!currentSession) return;

    const dataToUpdate: any = {
      messages: prepareMessagesForFirestore(newMessages),
      lastActivity: serverTimestamp(),
    };

    if (currentSession.title === 'New Chat' && suggestedNewTitle && suggestedNewTitle.trim() !== '') {
      dataToUpdate.title = suggestedNewTitle.trim();
    }
    
    try {
      const chatDocRef = doc(firestore, 'users', user.uid, 'chatSessions', chatId);
      await updateDoc(chatDocRef, dataToUpdate);
    } catch (error) {
      console.error("Error updating messages in session:", error);
      toast({ title: "Error", description: "Could not save message updates.", variant: "destructive"});
    }
  }, [user, toast, chatSessions]);

  const activeChatSession = useMemo(() => {
    if (!activeChatId) return null;
    return chatSessions.find(session => session.id === activeChatId) || null;
  }, [activeChatId, chatSessions]);

  const sidebarComponentContent = useMemo(() => (
    <>
      <SidebarHeader className="p-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold px-2 group-data-[collapsible=icon]:hidden">Conversations</h2>
        <div className="flex items-center">
          <SidebarTrigger className="hidden md:flex" /> 
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleNewChat}
            disabled={isLoadingSessions || authLoading}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-4rem)] group-data-[collapsible=icon]:hidden">
          <SidebarMenu className="px-2">
            {isLoadingSessions && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    <p className="mt-2">Loading conversations...</p>
                </div>
            )}
            {!isLoadingSessions && chatSessions.length === 0 && !authLoading && user && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                No past conversations. Click "New Chat" to start!
              </div>
            )}
            {!isLoadingSessions && chatSessions.map((session) => (
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton
                  onClick={() => handleSelectChat(session.id)}
                  isActive={activeChatId === session.id}
                  className="w-full justify-between text-left h-auto py-2 group flex items-center pr-1"
                  tooltip={{content: session.title || `Chat from ${formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}`, side: "right"}}
                >
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="truncate font-medium">{session.title || `Chat ${session.id}`}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div 
                        role="button"
                        tabIndex={0} 
                        className="ml-1 h-7 w-7 shrink-0 opacity-50 group-hover:opacity-100 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer p-1" 
                        onClick={(e) => e.stopPropagation()} 
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Chat options</span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => openRenameDialog(session)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(session)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50 dark:focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  ), [chatSessions, activeChatId, handleNewChat, handleSelectChat, user, authLoading, isLoadingSessions, openDeleteDialog, openRenameDialog]);

  if (authLoading || (!user && !isLoadingSessions)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <AuthenticatedPageLayout title="Empathy.AI Chat" sidebarComponent={sidebarComponentContent}>
      {activeChatSession ? (
        <ChatView 
          key={activeChatSession.id}
          chatSessionId={activeChatSession.id}
          initialMessages={activeChatSession.messages}
          onMessagesUpdate={(newMessages, newTitle) => {
            handleUpdateMessagesInSession(activeChatSession.id, newMessages, newTitle);
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-6 bg-background h-full">
          {isLoadingSessions && !authLoading ? (
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Loading your conversations...</p>
            </div>
          ) : (
            <div className="w-full max-w-md p-6 sm:p-8 text-center rounded-xl">
              <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot size={40} strokeWidth={1.5} className="sm:h-10 sm:w-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
                {chatSessions.length === 0 && user ? "Start a Conversation" : "Welcome to Empathy.AI"}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                {chatSessions.length === 0 && user 
                  ? "Click \"New Chat\" to begin your first conversation."
                  : "Select a conversation from the sidebar or click \"New Chat\" to begin."}
              </p>
              <Button onClick={handleNewChat} disabled={authLoading || isLoadingSessions}>
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Start New Chat
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Rename Chat Dialog */}
      <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new title for the chat: "{chatToRename?.title}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="New chat title"
            className="my-2"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmRenameChat(); } }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToRename(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRenameChat} disabled={!newChatTitle.trim() || newChatTitle.trim() === chatToRename?.title || authLoading}>
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Chat Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the chat "{chatToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800" disabled={authLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedPageLayout>
  );
}

