// src/components/layout/authenticated-page-layout.tsx
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { logOut } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, UserCog, MessageSquare } from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarTrigger, 
  SidebarInset 
} from '@/components/ui/sidebar';


interface AuthenticatedPageLayoutProps {
  children: ReactNode;
  title?: string;
  sidebarComponent?: ReactNode;
}

export function AuthenticatedPageLayout({ children, title = "Empathy.AI", sidebarComponent }: AuthenticatedPageLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await logOut();
    if (result.error) {
      toast({
        title: 'Logout Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.replace('/login');
    }
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <SidebarProvider defaultOpen={true}>
      {sidebarComponent && (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          {sidebarComponent}
        </Sidebar>
      )}
      <SidebarInset>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
              <div className="flex items-center space-x-2">
                {sidebarComponent && <SidebarTrigger className="mr-2 md:hidden" />}
                <Link href="/chat" className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  <span className="font-bold text-xl tracking-tight text-foreground">{title}</span>
                </Link>
              </div>
              
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/50">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${userInitial}`} alt={user.email ?? 'User'} data-ai-hint="abstract avatar"/>
                          <AvatarFallback>{userInitial}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-foreground">
                            {user.email}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            Empathy.AI User
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/chat" className="flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Chat</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                &copy; {new Date().getFullYear()} Empathy.AI. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
