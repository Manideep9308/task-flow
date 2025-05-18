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
    setSummary(null);

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
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-2 md:py-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            Task Summary Generator
          </CardTitle>
          <CardDescription>
            Let AI provide a concise summary of your current tasks, highlighting key priorities and upcoming deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {summary && (
            <div className="p-4 border rounded-md bg-secondary/50 prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Generated Summary:</h3>
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          )}
          {isLoading && (
             <div className="flex items-center justify-center p-8 my-4 border rounded-md bg-muted/30">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Generating summary, please wait...</p>
            </div>
          )}
          {!summary && !isLoading && tasks.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              You have no tasks to summarize. Add some tasks first!
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateSummary} 
            disabled={isLoading || tasks.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
