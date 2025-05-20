// src/app/chat/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthenticatedPageLayout } from '@/components/layout/authenticated-page-layout';
import { ChatView } from '@/components/chat/chat-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthenticatedPageLayout title="Empathy.AI Chat">
      <ChatView />
    </AuthenticatedPageLayout>
  );
}
