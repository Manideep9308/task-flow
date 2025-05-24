
"use client";

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Bot, Send, User, MessageSquare, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { AssistantMessage, Task } from '@/lib/types';
import { useTasks } from '@/contexts/task-context';
import { processUserQuery } from '@/ai/flows/app-assistant-flow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AppAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTasks(); 

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage: AssistantMessage = {
      id: uuidv4(),
      sender: 'user',
      text: userInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoadingResponse(true);

    const mappedTasksForAssistant = tasks.map(t => ({ // Map to AssistantTask schema
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo,
      description: t.description,
      category: t.category,
      dueDate: t.dueDate
    }));

    try {
      const aiResponse = await processUserQuery({ 
        userInput: userMessage.text,
        tasks: mappedTasksForAssistant
      });
      
      const assistantMessage: AssistantMessage = {
        id: uuidv4(),
        sender: 'assistant',
        text: aiResponse.assistantResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI assistant response:", error);
      const errorMessage: AssistantMessage = {
        id: uuidv4(),
        sender: 'assistant',
        text: "Sorry, I encountered an error trying to respond. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          sender: 'assistant',
          text: "Hello! I'm your IntelliTrack assistant. How can I help you today? You can ask about app features or your tasks.",
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  }, [isOpen, messages.length]);


  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-40 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-7 w-7" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" /> AI Assistant
            </SheetTitle>
            <SheetDescription>
              Ask questions about IntelliTrack or your tasks.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2 text-sm",
                    msg.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.sender === 'assistant' && (
                    <Bot className="h-6 w-6 text-primary self-start shrink-0" />
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-lg shadow-sm",
                      msg.sender === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-muted-foreground rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className={cn(
                        "text-xs mt-1 opacity-70",
                        msg.sender === 'user' ? "text-right" : ""
                      )}
                    >
                      {format(new Date(msg.timestamp), "p")}
                    </p>
                  </div>
                  {msg.sender === 'user' && (
                     <User className="h-6 w-6 text-muted-foreground self-start shrink-0" />
                  )}
                </div>
              ))}
              {isLoadingResponse && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bot className="h-6 w-6 text-primary" />
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                type="text"
                placeholder="Ask something..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1"
                disabled={isLoadingResponse}
              />
              <Button type="submit" size="icon" disabled={isLoadingResponse || !userInput.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
