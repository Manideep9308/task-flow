
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockStandupSummaries } from "@/lib/mock-data"; // Using mock data
import type { StandupSummary } from "@/lib/types";
import { MessageSquareText, CalendarDays } from "lucide-react";
import { format, parseISO } from 'date-fns';

// In a real app, you'd fetch this from a backend or context
const standupSummaries: StandupSummary[] = mockStandupSummaries;

export default function StandupHistoryPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-8 w-8 text-primary" />
          Standup Summary History
        </h1>
        {/* Placeholder for future actions like "Generate Today's Summary" */}
      </div>

      {standupSummaries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Summaries Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              There are no standup summaries recorded. Once summaries are generated, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]"> {/* Adjust height as needed */}
          <div className="space-y-6">
            {standupSummaries.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((summary) => (
              <Card key={summary.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                      Standup for {format(parseISO(summary.date), "MMMM d, yyyy")}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>{format(parseISO(summary.date), "EEE, MMM d")}</span>
                    </div>
                  </div>
                  {summary.projectId && (
                    <CardDescription>Project: {summary.projectId}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Using dangerouslySetInnerHTML for mock data with markdown-like bolding. 
                      In a real app with user-generated content or real AI output, 
                      ensure proper sanitization or use a markdown renderer. */}
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: summary.summaryText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
