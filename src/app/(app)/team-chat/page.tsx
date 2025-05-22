
"use client";

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessagesSquare, Wand2, Loader2, Info, Sparkles } from 'lucide-react'; // Added Wand2, Loader2, Info
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';
import { suggestChatReplies, type SuggestChatRepliesInput, type SuggestChatRepliesOutput } from '@/ai/flows/suggest-chat-replies-flow';
import { generateChatHighlights, type GenerateChatHighlightsInput, type GenerateChatHighlightsOutput } from '@/ai/flows/generate-chat-highlights-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";


export default function TeamChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const [chatHighlights, setChatHighlights] = useState<string | null>(null);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const { toast } = useToast();


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
    setSuggestedReplies([]); // Clear suggestions after sending a message
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }

    // Fetch smart replies
    const fetchReplies = async () => {
      if (messages.length > 0 && user) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.userId !== user.id) { // Only suggest if current user isn't the last sender
          setIsLoadingReplies(true);
          setSuggestedReplies([]);
          try {
            const input: SuggestChatRepliesInput = {
              recentMessages: messages.slice(-3), // Send last 3 messages
              currentUser: user,
            };
            const result: SuggestChatRepliesOutput = await suggestChatReplies(input);
            setSuggestedReplies(result.suggestedReplies.filter(reply => reply.trim() !== ""));
          } catch (error) {
            console.error("Error fetching smart replies:", error);
            setSuggestedReplies([]); // Clear on error
          } finally {
            setIsLoadingReplies(false);
          }
        } else {
           setSuggestedReplies([]); // Clear if current user sent the last message
        }
      }
    };
    fetchReplies();
  }, [messages, user]);

  const handleGenerateHighlights = async () => {
    if (!messages || messages.length === 0) {
      toast({
        title: "No Messages",
        description: "There are no messages in the chat to generate highlights from.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingHighlights(true);
    setChatHighlights(null);
    setHighlightsError(null);
    try {
      const input: GenerateChatHighlightsInput = { messages };
      const result: GenerateChatHighlightsOutput = await generateChatHighlights(input);
      setChatHighlights(result.highlights);
      // Display highlights in an alert or toast
      // For simplicity, we'll use an Alert component state for this demo
    } catch (error) {
      console.error("Error generating chat highlights:", error);
      setHighlightsError(error instanceof Error ? error.message : "Failed to generate highlights.");
      setChatHighlights(null);
    } finally {
      setIsLoadingHighlights(false);
    }
  };


  return (
    <div className="container mx-auto pt-0 h-full flex flex-col">
      <Card className="shadow-xl mt-2 md:mt-6 flex-1 flex flex-col">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <MessagesSquare className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Team Chat</CardTitle>
                <CardDescription className="text-md">
                  General discussion and AI-assisted interactions.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleGenerateHighlights} variant="outline" size="sm" disabled={isLoadingHighlights || messages.length === 0}>
              {isLoadingHighlights ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Highlights
            </Button>
          </div>
        </CardHeader>
        
        {chatHighlights && !isLoadingHighlights && (
          <div className="p-4 border-b">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Chat Highlights</AlertTitle>
              <AlertDescription className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {chatHighlights}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {highlightsError && !isLoadingHighlights && (
          <div className="p-4 border-b">
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Error Generating Highlights</AlertTitle>
              <AlertDescription>{highlightsError}</AlertDescription>
            </Alert>
          </div>
        )}


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
        <CardFooter className="p-4 border-t flex flex-col items-start gap-2">
          {isLoadingReplies && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-center">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Suggesting replies...</span>
            </div>
          )}
          {suggestedReplies.length > 0 && !isLoadingReplies && (
            <div className="flex flex-wrap gap-2 mb-2 self-center">
              {suggestedReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setNewMessageText(reply);
                    setSuggestedReplies([]); // Clear suggestions once one is clicked
                  }}
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}
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
