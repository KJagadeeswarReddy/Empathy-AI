// src/app/signup/page.tsx
"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/hooks/use-auth";
import { signUp } from "@/lib/firebase/auth";
import type { SignupSchema as SignupSchemaType } from "@/lib/schemas/auth-schemas";
import { SignupSchema } from "@/lib/schemas/auth-schemas";
import { useToast } from "@/hooks/use-toast";
import type { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type * as z from "zod";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/chat");
    }
  }, [user, authLoading, router]);

  const handleSignup = async (values: z.infer<typeof SignupSchema>) => {
    setErrorMessage(null);
    const result = await signUp(values.email, values.password);
    if (result.error) {
      setErrorMessage(result.error);
      toast({
        title: "Signup Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signup Successful",
        description: "Welcome to Empathy.AI! Redirecting to chat...",
      });
      router.push("/chat");
    }
  };
  
  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* Optionally, a spinner here or rely on AuthProvider's spinner */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <AuthForm mode="signup" onSubmit={handleSignup} errorMessage={errorMessage} />
    </div>
  );
}
