// src/components/profile/user-profile.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { changePassword } from "@/lib/firebase/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangePasswordSchema } from "@/lib/schemas/auth-schemas";
import type * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KeyRound, Mail } from "lucide-react";

export function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const handleChangePassword = async (values: z.infer<typeof ChangePasswordSchema>) => {
    setIsLoading(true);
    const result = await changePassword(values.newPassword);
    if (result.error) {
      toast({
        title: "Password Change Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
      });
      form.reset();
    }
    setIsLoading(false);
  };

  if (!user) {
    return <p className="text-center mt-8">Please log in to view your profile.</p>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Your Profile</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <div className="flex items-center space-x-2 rounded-md border border-input bg-muted px-3 py-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p id="email" className="text-sm text-foreground">{user.email}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <KeyRound className="mr-2 h-5 w-5 text-primary" />
                  Change Password
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter a new password for your account.
                </p>
              </div>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                   <KeyRound className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        {/* <CardFooter>
          <p className="text-xs text-muted-foreground">
            For major account changes or issues, please contact support.
          </p>
        </CardFooter> */}
      </Card>
    </div>
  );
}
