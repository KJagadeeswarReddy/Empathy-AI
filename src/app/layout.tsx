import type { Metadata } from 'next';
import { GeistSans } from 'next/font/google'; // Corrected import for Geist
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-provider';
import { Toaster } from "@/components/ui/toaster"; // ShadCN Toaster

const geistSans = GeistSans({ // Corrected instantiation
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

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
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
