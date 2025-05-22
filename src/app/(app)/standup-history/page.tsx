
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareText, CalendarDays, Wand2, AlertTriangle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { mockStandupSummaries } from "@/lib/mock-data"; // Using mock data
import type { StandupSummary, StandupReportItem, Task } from "@/lib/types";
import { generateStandupSummary, type GenerateStandupSummaryInput } from "@/ai/flows/generate-standup-summary-flow";
import { useTasks } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// In a real app, you'd fetch this from a backend or context
const historicalStandupSummaries: StandupSummary[] = mockStandupSummaries;

export default function StandupHistoryPage() {
  const { tasks } = useTasks();
  const { assignableUsers } = useAuth();

  const [todaysSummary, setTodaysSummary] = useState<StandupSummary | null>(null);
  const [isGeneratingTodaysSummary, setIsGeneratingTodaysSummary] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const formatSummaryTextForDisplay = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\n/g, '<br />'); // Newlines
  };

  const handleGenerateTodaysMockSummary = async () => {
    setIsGeneratingTodaysSummary(true);
    setGenerationError(null);
    setTodaysSummary(null);

    // Create mock input for a few users
    const mockReports: StandupReportItem[] = [];
    const usersToReport = assignableUsers.slice(0, 3); // Take first 3 users for demo

    usersToReport.forEach(user => {
      const userTasks: Task[] = tasks.filter(t => t.assignedTo === user.id);
      let didYesterday = "Worked on various project tasks.";
      let doingToday = "Continuing with assigned tasks.";
      let blockers = "";

      if (userTasks.length > 0) {
        const recentTask = userTasks.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        didYesterday = `Focused on "${recentTask.title}".`;
        doingToday = `Will continue working on "${recentTask.title}" and other assignments.`;
        if (recentTask.status === 'inprogress' && Math.random() > 0.7) { // Randomly add a blocker
          blockers = `Facing a minor challenge with "${recentTask.title}".`;
        }
      } else {
        didYesterday = "Reviewed project documentation and prepared for upcoming tasks.";
        doingToday = "Planning to pick up new tasks from the backlog.";
      }
      
      mockReports.push({
        userId: user.id,
        userName: user.name || user.email,
        didYesterday,
        doingToday,
        blockers: blockers || "None reported",
      });
    });
    
    if (mockReports.length === 0) {
         mockReports.push({
            userId: 'mock-user-system',
            userName: 'System Admin',
            didYesterday: 'Monitored system performance and addressed minor issues.',
            doingToday: 'Scheduled routine maintenance and reviewed project timelines.',
            blockers: 'None reported',
        });
    }


    const input: GenerateStandupSummaryInput = {
      reports: mockReports,
      projectName: "TaskFlow Project (Demo)",
      summaryDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      const result = await generateStandupSummary(input);
      setTodaysSummary({
        id: `today-${Date.now()}`,
        date: input.summaryDate!,
        summaryText: result.consolidatedSummary,
        projectId: input.projectName,
      });
    } catch (e) {
      console.error("Error generating today's summary:", e);
      setGenerationError(e instanceof Error ? e.message : "Failed to generate summary.");
    } finally {
      setIsGeneratingTodaysSummary(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 md:mt-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-8 w-8 text-primary" />
          Standup Summaries
        </h1>
        <Button 
          onClick={handleGenerateTodaysMockSummary} 
          disabled={isGeneratingTodaysSummary}
          className="mt-3 sm:mt-0"
        >
          {isGeneratingTodaysSummary ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Today's Mock Summary
        </Button>
      </div>

      {isGeneratingTodaysSummary && (
        <Card className="mb-6 shadow-lg bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Generating Today's Summary...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while the AI crafts the summary.</p>
          </CardContent>
        </Card>
      )}

      {generationError && !isGeneratingTodaysSummary && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Generating Summary</AlertTitle>
          <AlertDescription>{generationError}</AlertDescription>
        </Alert>
      )}

      {todaysSummary && !isGeneratingTodaysSummary && !generationError && (
        <Card key={todaysSummary.id} className="mb-6 shadow-xl border-primary border-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-primary">
                Today's Standup Summary ({format(parseISO(todaysSummary.date), "MMMM d, yyyy")})
              </CardTitle>
              <div className="flex items-center text-sm text-primary gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{format(parseISO(todaysSummary.date), "EEE, MMM d")}</span>
              </div>
            </div>
            {todaysSummary.projectId && (
              <CardDescription>Project: {todaysSummary.projectId}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatSummaryTextForDisplay(todaysSummary.summaryText) }} 
            />
          </CardContent>
        </Card>
      )}
      
      <CardTitle className="text-2xl mb-4 mt-8">Historical Summaries</CardTitle>
      {historicalStandupSummaries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Historical Summaries Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              There are no past standup summaries recorded.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-26rem)]"> {/* Adjusted height based on potential top card */}
          <div className="space-y-6">
            {historicalStandupSummaries.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((summary) => (
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
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatSummaryTextForDisplay(summary.summaryText) }} 
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

