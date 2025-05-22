
"use client";

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessagesSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';

export default function TeamChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!newMessageText.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name || user.email,
      text: newMessageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setNewMessageText('');
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="container mx-auto pt-0 h-full flex flex-col">
      <Card className="shadow-xl mt-2 md:mt-6 flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessagesSquare className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Team Chat</CardTitle>
              <CardDescription className="text-md">
                General discussion and announcements.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              )}
              {messages.map((msg) => {
                const isCurrentUser = msg.userId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 text-xs self-start shrink-0">
                        <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] p-3 rounded-lg shadow",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      )}
                    >
                      {!isCurrentUser && (
                        <p className="text-xs font-medium mb-0.5">{msg.userName}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={cn(
                          "text-xs mt-1",
                          isCurrentUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70"
                        )}
                      >
                        {format(parseISO(msg.timestamp), "p")}
                      </p>
                    </div>
                     {isCurrentUser && (
                      <Avatar className="h-8 w-8 text-xs self-start shrink-0">
                        <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!user}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!user || !newMessageText.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
