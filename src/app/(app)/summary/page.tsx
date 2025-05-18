
"use client";

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { summarizeTasks, type SummarizeTasksInput, type SummarizeTasksOutput } from '@/ai/flows/summarize-tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

export default function SummaryPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();

  // State for general summary
  const [generalSummary, setGeneralSummary] = useState<string | null>(null);
  const [isGeneralSummaryLoading, setIsGeneralSummaryLoading] = useState(false);
  const [generalSummaryError, setGeneralSummaryError] = useState<string | null>(null);

  // State for prompt-based summary
  const [promptText, setPromptText] = useState<string>("");
  const [promptBasedSummary, setPromptBasedSummary] = useState<string | null>(null);
  const [isPromptBasedSummaryLoading, setIsPromptBasedSummaryLoading] = useState(false);
  const [promptBasedSummaryError, setPromptBasedSummaryError] = useState<string | null>(null);

  const handleGenerateGeneralSummary = async () => {
    setIsGeneralSummaryLoading(true);
    setGeneralSummaryError(null);
    
    const mappedTasks: SummarizeTasksInput['tasks'] = tasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    }));

    try {
      const result: SummarizeTasksOutput = await summarizeTasks({ tasks: mappedTasks });
      setGeneralSummary(result.summary);
    } catch (e) {
      console.error("Error generating general summary:", e);
      setGeneralSummaryError(e instanceof Error ? e.message : "Failed to generate general summary. Please try again.");
      setGeneralSummary(null);
    } finally {
      setIsGeneralSummaryLoading(false);
    }
  };

  const handleGeneratePromptSummary = async () => {
    if (!promptText.trim()) {
      setPromptBasedSummaryError("Please enter a search term or keyword.");
      setPromptBasedSummary(null);
      return;
    }
    setIsPromptBasedSummaryLoading(true);
    setPromptBasedSummaryError(null);
    setPromptBasedSummary(null);

    const lowerCasePrompt = promptText.toLowerCase();
    const filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(lowerCasePrompt) ||
      (task.description && task.description.toLowerCase().includes(lowerCasePrompt)) ||
      (task.category && task.category.toLowerCase().includes(lowerCasePrompt))
    );

    if (filteredTasks.length === 0) {
      setPromptBasedSummaryError(`No tasks found matching "${promptText}".`);
      setIsPromptBasedSummaryLoading(false);
      return;
    }
    
    const mappedTasks: SummarizeTasksInput['tasks'] = filteredTasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    }));

    try {
      const result: SummarizeTasksOutput = await summarizeTasks({ tasks: mappedTasks });
      setPromptBasedSummary(result.summary);
    } catch (e) {
      console.error("Error generating prompt-based summary:", e);
      setPromptBasedSummaryError(e instanceof Error ? e.message : "Failed to generate summary for your prompt. Please try again.");
      setPromptBasedSummary(null);
    } finally {
      setIsPromptBasedSummaryLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-2 md:py-6 space-y-8">
      {/* Prompt-based Summary Section */}
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            AI Summary for Specific Tasks/Projects
          </CardTitle>
          <CardDescription className="text-md">
            Enter a task name, project keyword, or related term to get a targeted AI summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              type="text"
              placeholder="e.g., Marketing Campaign, Homepage UI, urgent bugfix"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-grow"
              disabled={isPromptBasedSummaryLoading}
            />
            <Button 
              onClick={handleGeneratePromptSummary} 
              disabled={isPromptBasedSummaryLoading || !promptText.trim()}
            >
              {isPromptBasedSummaryLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          {isPromptBasedSummaryLoading && (
             <div className="flex flex-col items-center justify-center p-6 my-3 border rounded-lg bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                <p className="text-md text-muted-foreground">Generating summary for "{promptText}"...</p>
            </div>
          )}

          {promptBasedSummaryError && !isPromptBasedSummaryLoading && (
            <Alert variant="destructive" className="my-3">
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription>{promptBasedSummaryError}</AlertDescription>
            </Alert>
          )}

          {promptBasedSummary && !isPromptBasedSummaryLoading && !promptBasedSummaryError && (
            <div className="p-4 border rounded-lg bg-card shadow mt-4">
              <h3 className="text-lg font-semibold mb-2 text-primary">Summary for "{promptText}":</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {promptBasedSummary}
              </div>
            </div>
          )}
          {!promptBasedSummary && !isPromptBasedSummaryLoading && !promptBasedSummaryError && !promptText && (
             <p className="text-sm text-muted-foreground text-center py-4">Enter a term above and click "Generate" to get a specific summary.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* General Task Summary Section */}
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-7 w-7 text-primary" />
            Overall AI Task Summarizer
          </CardTitle>
          <CardDescription className="text-md">
            Let AI provide a concise summary of all your current tasks, highlighting key priorities and upcoming deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGeneralSummaryLoading && (
             <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                <p className="text-lg text-muted-foreground">Generating overall summary...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments.</p>
            </div>
          )}

          {generalSummaryError && !isGeneralSummaryLoading && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="font-semibold">Error Generating Overall Summary</AlertTitle>
              <AlertDescription>{generalSummaryError}</AlertDescription>
            </Alert>
          )}

          {generalSummary && !isGeneralSummaryLoading && !generalSummaryError && (
            <div className="p-4 border rounded-lg bg-card shadow">
              <h3 className="text-xl font-semibold mb-3 text-primary">Overall Task Summary:</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {generalSummary}
              </div>
            </div>
          )}
          
          {!generalSummary && !isGeneralSummaryLoading && !generalSummaryError && tasksLoading && (
            <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-lg">Loading tasks...</p>
            </div>
          )}
          {!generalSummary && !isGeneralSummaryLoading && !generalSummaryError && !tasksLoading && tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">No tasks to summarize.</p>
              <p>Add some tasks to your list, then come back to generate an overall summary.</p>
            </div>
          )}
           {!generalSummary && !isGeneralSummaryLoading && !generalSummaryError && !tasksLoading && tasks.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">Ready to generate your overall task summary?</p>
              <p>Click the button below to get started.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateGeneralSummary} 
            disabled={isGeneralSummaryLoading || tasks.length === 0 || tasksLoading}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isGeneralSummaryLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Overall Summary
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
