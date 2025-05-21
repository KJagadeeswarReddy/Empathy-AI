import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for Geist
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-provider';
import { Toaster } from "@/components/ui/toaster"; // ShadCN Toaster

export const metadata: Metadata = {
  title: 'Empathy.AI - Your Empathetic AI Assistant',
  description: 'Chat with an AI designed to help you solve problems and provide empathetic support.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
