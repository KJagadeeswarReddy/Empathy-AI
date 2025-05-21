// src/lib/schemas/auth-schemas.ts
import * as z from "zod";

const PasswordSchema = z.string().min(8, { message: "Password must be at least 8 characters long." })
  // .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  // .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  // .regex(/[0-9]/, { message: "Password must contain at least one number." })
  // .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });
  // Firebase handles password complexity rules, so a simple min length is often sufficient here.
  // The specific rules can be enforced by Firebase and error messages handled.

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
  path: ["confirmPassword"],
});

export const ChangePasswordSchema = z.object({
  newPassword: PasswordSchema,
  confirmNewPassword: PasswordSchema,
})
.refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match.",
  path: ["confirmNewPassword"],
});
