// src/components/chat/chat-message.tsx
import type { Message } from '@/types';
// Avatar and icons were removed in a previous step to match ChatGPT style
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Bot, User } from 'lucide-react';
// Card components are being removed to reduce "boxy" feel.
// import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  showJustifications: boolean;
}

// A simple markdown-like renderer for bold and italics
const SimpleMarkdownRenderer = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|```[^`]+```)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part === undefined) return null; // Handle undefined parts
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('```') && part.endsWith('```')) {
          return <pre key={index} className="my-2 p-2 bg-muted/50 dark:bg-black/30 rounded-md text-sm overflow-x-auto">{part.slice(3,-3).trim()}</pre>
        }
        // Basic list item handling (very rudimentary)
        if (part.trim().startsWith('- ')) {
            return <li key={index} className="ml-4 list-disc">{part.trim().substring(2)}</li>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};


export function ChatMessage({ message, showJustifications }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-end space-x-3 py-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
          "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl text-sm break-words",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-none order-1" 
            : "bg-muted text-muted-foreground rounded-bl-none order-2"
        )}
      >
        <SimpleMarkdownRenderer text={message.content} />
         {/* Timestamp and Justification moved inside the bubble for sleeker look if !isUser */}
        {!isUser && (
          <div className={cn("mt-2 flex flex-col items-start text-xs", !isUser && "text-muted-foreground/80")}>
            <span className="opacity-80">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
            {message.justification && showJustifications && (
              <div className="mt-1 p-1.5 text-xs bg-background/50 dark:bg-muted/30 border border-border/50 rounded-md italic">
                <span className="font-semibold">Justification:</span> {message.justification}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Timestamp and Justification outside for user messages */}
      {isUser && (
        <div className={cn("order-2 flex flex-col items-end text-xs text-muted-foreground/80", isUser ? "pr-1" : "pl-1")}>
           <span>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
           </span>
        </div>
      )}
    </div>
  );
}
