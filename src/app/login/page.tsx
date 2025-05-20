// src/app/login/page.tsx
"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/hooks/use-auth";
import { logIn } from "@/lib/firebase/auth";
import type { LoginSchema as LoginSchemaType } from "@/lib/schemas/auth-schemas";
import { LoginSchema } from "@/lib/schemas/auth-schemas";
import { useToast } from "@/hooks/use-toast";
import type { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type * as z from "zod";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/chat");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (values: z.infer<typeof LoginSchema>) => {
    setErrorMessage(null);
    const result = await logIn(values.email, values.password);
    if (result.error) {
      setErrorMessage(result.error);
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/chat");
    }
  };

  if (authLoading || (!authLoading && user)) {
    // Show loading or redirect if user is already logged in (handled by useEffect)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* Optionally, a spinner here or rely on AuthProvider's spinner */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <AuthForm mode="login" onSubmit={handleLogin} errorMessage={errorMessage} />
    </div>
  );
}
