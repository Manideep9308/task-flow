
"use client";

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { summarizeTasks, type SummarizeTasksInput, type SummarizeTasksOutput } from '@/ai/flows/summarize-tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SummaryPage() {
  const { tasks } = useTasks();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    // Keep previous summary visible while loading new one, or setSummary(null);
    
    const mappedTasks: SummarizeTasksInput['tasks'] = tasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    }));

    try {
      const result: SummarizeTasksOutput = await summarizeTasks({ tasks: mappedTasks });
      setSummary(result.summary);
    } catch (e) {
      console.error("Error generating summary:", e);
      setError(e instanceof Error ? e.message : "Failed to generate summary. Please try again.");
      setSummary(null); // Clear previous summary on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-2 md:py-6">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-7 w-7 text-primary" />
            AI Task Summarizer
          </CardTitle>
          <CardDescription className="text-md">
            Let AI provide a concise summary of your current tasks, highlighting key priorities and upcoming deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
             <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                <p className="text-lg text-muted-foreground">Generating summary, please wait...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments.</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="font-semibold">Error Generating Summary</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {summary && !isLoading && !error && (
            <div className="p-4 border rounded-lg bg-card shadow">
              <h3 className="text-xl font-semibold mb-3 text-primary">Generated Summary:</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          )}
          
          {!summary && !isLoading && !error && tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">No tasks to summarize.</p>
              <p>Add some tasks to your list, then come back to generate a summary.</p>
            </div>
          )}
           {!summary && !isLoading && !error && tasks.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">Ready to generate your task summary?</p>
              <p>Click the button below to get started.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateSummary} 
            disabled={isLoading || tasks.length === 0}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Summary
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
