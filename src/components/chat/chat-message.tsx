// src/components/chat/chat-message.tsx
import type { Message } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  showJustifications: boolean;
}

// A simple markdown-like renderer for bold and italics
const SimpleMarkdownRenderer = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        // Basic list item handling (very rudimentary)
        if (part.trim().startsWith('- ')) {
            return <li key={index} className="ml-4 list-disc">{part.trim().substring(2)}</li>;
        }
        // Basic code block (simple pre for now)
        if (part.startsWith('```') && part.endsWith('```')) {
            return <pre key={index} className="my-2 p-2 bg-muted rounded-md text-sm overflow-x-auto">{part.slice(3,-3).trim()}</pre>
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};


export function ChatMessage({ message, showJustifications }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const avatarInitial = isUser ? (message.id.slice(0,1).toUpperCase() || 'U') : 'AI';
  const avatarIcon = isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />;

  return (
    <div className={cn("flex items-start space-x-3 py-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-10 w-10 border bg-accent/20 text-accent">
          <AvatarFallback className="bg-transparent">{avatarIcon}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-xs md:max-w-md lg:max-w-lg", isUser ? "order-1 items-end" : "order-2 items-start")}>
        <Card className={cn(
          "rounded-2xl shadow-md", 
          isUser ? "bg-primary/80 text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none"
        )}>
          <CardContent className="p-3 text-sm break-words">
            <SimpleMarkdownRenderer text={message.content} />
          </CardContent>
        </Card>
        <div className={cn("mt-1 flex items-center space-x-2", isUser ? "justify-end pr-1" : "justify-start pl-1")}>
            <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
            {!isUser && message.justification && showJustifications && (
            <Card className="mt-1 p-2 text-xs bg-muted/50 border-dashed border-muted-foreground/30 rounded-md">
                <p className="italic text-muted-foreground">
                <span className="font-semibold">Justification:</span> {message.justification}
                </p>
            </Card>
            )}
        </div>
      </div>
      {isUser && (
         <Avatar className="h-10 w-10 border bg-secondary/50 text-secondary-foreground">
          <AvatarFallback className="bg-transparent">{avatarIcon}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
