
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareText, CalendarDays, Wand2, AlertTriangle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { mockStandupSummaries } from "@/lib/mock-data"; 
import type { StandupSummary, StandupReportItem, Task } from "@/lib/types";
import { generateStandupSummary, type GenerateStandupSummaryInput } from "@/ai/flows/generate-standup-summary-flow";
import { useTasks } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StandupHistoryPage() {
  const { tasks } = useTasks(); 
  const { assignableUsers } = useAuth();

  const [todaysSummary, setTodaysSummary] = useState<StandupSummary | null>(null);
  const [isGeneratingTodaysSummary, setIsGeneratingTodaysSummary] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [displayedHistoricalSummaries, setDisplayedHistoricalSummaries] = useState<StandupSummary[]>(() => 
    [...mockStandupSummaries].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
  );

  const formatSummaryTextForDisplay = (text: string | undefined | null, allTasks: Task[]): string => {
    if (!text) return "";
    
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\n/g, '<br />'); 

    const sortedTasks = [...allTasks].sort((a, b) => b.title.length - a.title.length);
    sortedTasks.forEach(task => {
      if (task.title) {
        const titleRegex = new RegExp(`(?<!href="[^"]*?)(\\b${task.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b)(?!.*?</a>)`, 'gi');
        formattedText = formattedText.replace(titleRegex, (match) => 
          `<a href="/tasks?openTask=${task.id}" class="text-primary hover:underline">${match}</a>`
        );
      }
    });
    
    return formattedText;
  };

  const handleGenerateTodaysMockSummary = async () => {
    setIsGeneratingTodaysSummary(true);
    setGenerationError(null);

    const mockReports: StandupReportItem[] = [];
    const usersToReport = assignableUsers.slice(0, 3); 

    usersToReport.forEach(user => {
      const userTasks: Task[] = tasks.filter(t => t.assignedTo === user.id);
      let didYesterday = "Worked on various project tasks.";
      let doingToday = "Continuing with assigned tasks.";
      let blockers = "None reported"; 

      if (userTasks.length > 0) {
        const recentlyCompleted = userTasks.find(t => t.status === 'done');
        const inProgress = userTasks.find(t => t.status === 'inprogress');
        
        if (recentlyCompleted) {
          didYesterday = `Completed "${recentlyCompleted.title}".`;
        } else {
          didYesterday = "Reviewed project documentation.";
        }
        
        if (inProgress) {
          doingToday = `Will continue working on "${inProgress.title}".`;
          if (Math.random() > 0.7) { 
            blockers = `Facing a challenge with "${inProgress.title}". Needs urgent attention.`;
          }
        } else {
          const todoTask = userTasks.find(t => t.status === 'todo');
          doingToday = todoTask ? `Planning to start "${todoTask.title}".` : "Planning to pick up new tasks from the backlog.";
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
        blockers,
      });
    });
    
    if (mockReports.length === 0 && assignableUsers.length > 0) {
         mockReports.push({
            userId: assignableUsers[0].id,
            userName: assignableUsers[0].name || assignableUsers[0].email,
            didYesterday: 'Monitored system performance and addressed minor issues.',
            doingToday: 'Scheduled routine maintenance and reviewed project timelines for "IntelliTrack Project Alpha".',
            blockers: 'Waiting for feedback on "Client Proposal Q3".',
        });
    } else if (mockReports.length === 0) {
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
      projectName: "IntelliTrack Project (Demo)",
      summaryDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      const result = await generateStandupSummary(input);
      const newSummary: StandupSummary = {
        id: `today-${Date.now()}`, 
        date: input.summaryDate!,
        summaryText: result.consolidatedSummary,
        projectId: input.projectName,
      };
      setTodaysSummary(newSummary); 
      
      setDisplayedHistoricalSummaries(prevSummaries => {
        const filteredPrev = prevSummaries.filter(s => !s.id.startsWith('today-'));
        return [newSummary, ...filteredPrev].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      });

    } catch (e) {
      console.error("Error generating today's summary:", e);
      setGenerationError(e instanceof Error ? e.message : "Failed to generate summary.");
      setTodaysSummary(null);
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
                Today's Standup Summary ({format(parseISO(todaysSummary.date), "PPP")})
              </CardTitle>
              <div className="flex items-center text-sm text-primary gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>Generated: {format(parseISO(todaysSummary.date), "EEE, MMM d, yyyy")}</span>
              </div>
            </div>
            {todaysSummary.projectId && (
              <CardDescription>Project: {todaysSummary.projectId}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formatSummaryTextForDisplay(todaysSummary.summaryText, tasks) }} 
            />
          </CardContent>
        </Card>
      )}
      
      <CardTitle className="text-2xl mb-4 mt-8">Historical Summaries</CardTitle>
      {displayedHistoricalSummaries.length === 0 && !todaysSummary && !isGeneratingTodaysSummary && !generationError ? (
        <Card>
          <CardHeader>
            <CardTitle>No Standup Summaries Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Generate today's summary or check back later for historical records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-30rem)]"> 
          <div className="space-y-6">
            {displayedHistoricalSummaries.map((summary) => (
              (todaysSummary && todaysSummary.id === summary.id && !generationError && !isGeneratingTodaysSummary) ? null : (
                <Card key={summary.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">
                        Summary for {format(parseISO(summary.date), "MMMM d, yyyy")}
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
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatSummaryTextForDisplay(summary.summaryText, tasks) }} 
                    />
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
