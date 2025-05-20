// src/components/auth/auth-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { LoginSchema, SignupSchema } from "@/lib/schemas/auth-schemas";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { LoadingSpinner } from "../ui/loading-spinner";
import { LogIn, UserPlus } from 'lucide-react';

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (values: z.infer<typeof LoginSchema | typeof SignupSchema>) => Promise<void>;
  errorMessage?: string | null;
}

export function AuthForm({ mode, onSubmit, errorMessage }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const schema = mode === "login" ? LoginSchema : SignupSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "signup" && { confirmPassword: "" }),
    },
  });

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    await onSubmit(values);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {mode === 'login' ? <LogIn size={32} /> : <UserPlus size={32} />}
        </div>
        <CardTitle className="text-3xl font-bold">
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Log in to continue your empathetic journey."
            : "Join Empathy.AI and start your conversation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : mode === "login" ? (
                <LogIn className="mr-2 h-5 w-5" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              {isLoading
                ? "Processing..."
                : mode === "login"
                ? "Log In"
                : "Sign Up"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Button variant="link" asChild className="p-0 text-primary">
            <Link href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Sign up" : "Log in"}
            </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}

// Define Zod schemas for validation
// This should be in a separate file like 'src/lib/schemas/auth-schemas.ts' but placing here for brevity.
const PasswordSchema = z.string().min(8, { message: "Password must be at least 8 characters long." });

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const SignupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: PasswordSchema,
  confirmPassword: PasswordSchema,
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Path of error
});
