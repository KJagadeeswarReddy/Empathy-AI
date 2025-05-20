// src/hooks/use-auth.ts
"use client";

import type { AuthContextType } from '@/lib/firebase/auth-provider';
import { AuthContext } from '@/lib/firebase/auth-provider';
import { useContext } from 'react';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
