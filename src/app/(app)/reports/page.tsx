
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, AlertTriangle, FileText, BarChart3, Zap, Lightbulb, AlertOctagon, Trophy, CheckCircle, Target } from "lucide-react"; // Added Target
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTasks } from "@/contexts/task-context";
import type { ProjectTaskSnapshot, GenerateProjectHealthReportOutput, GenerateProjectHealthReportInput } from "@/lib/types";
import { generateProjectHealthReport } from "@/ai/flows/generate-project-health-report-flow";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';

export default function ReportsPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [report, setReport] = useState<GenerateProjectHealthReportOutput | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setReportError(null);
    setReport(null);

    const mappedTasks: ProjectTaskSnapshot[] = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignedTo: t.assignedTo,
      category: t.category,
    }));

    const input: GenerateProjectHealthReportInput = {
      tasks: mappedTasks,
      projectName: "TaskFlow Project (Demo)", // Mock project name
      reportDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      const result = await generateProjectHealthReport(input);
      setReport(result);
    } catch (e) {
      console.error("Error generating project health report:", e);
      setReportError(e instanceof Error ? e.message : "Failed to generate health report. Please try again.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  const renderFormattedText = (text: string | undefined) => {
    if (!text) return null;
    // Simple formatting: replace newlines with <br /> for display
    // More complex markdown could be handled here if needed
    return text.split('\\n').map((line, index, array) => ( // Handle escaped newlines from AI
      line.split('\n').map((subLine, subIndex, subArray) => ( // Handle actual newlines
        <span key={`${index}-${subIndex}`}>
          {subLine}
          {(subIndex < subArray.length - 1 || index < array.length - 1) && <br />}
        </span>
      ))
    )).flat();
  };


  return (
    <div className="container mx-auto space-y-8 pt-0">
      <Card className="shadow-xl mt-2 md:mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Project Health Reports</CardTitle>
              <CardDescription className="text-md">
                Generate AI-powered health reports for your project based on current task data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGenerateReport}
            disabled={isLoadingReport || tasksLoading || tasks.length === 0}
            className="w-full md:w-auto text-base py-2.5"
            size="lg"
          >
            {isLoadingReport ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Generate Project Health Report
          </Button>
          
          {tasksLoading && !isLoadingReport && (
             <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading task data...
             </div>
          )}

          {!tasksLoading && tasks.length === 0 && !isLoadingReport && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Tasks Available</AlertTitle>
              <AlertDescription>
                Cannot generate a report as there are no tasks in the project. Please add some tasks first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {isLoadingReport && (
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">Generating health report...</p>
              <p className="text-sm text-muted-foreground">The AI is analyzing your project data. This may take a moment.</p>
            </div>
          </CardContent>
        )}

        {reportError && !isLoadingReport && (
          <CardContent>
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Report Generation Error</AlertTitle>
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {report && !isLoadingReport && !reportError && (
          <CardContent className="space-y-6 pt-6">
            <Card className="bg-card shadow-lg border border-primary/30">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-primary">
                            Project Health Report
                            {report.projectName && ` for ${report.projectName}`}
                        </CardTitle>
                        {report.reportDate && (
                            <span className="text-sm text-muted-foreground">
                                Generated: {format(new Date(report.reportDate), "PPP")}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <FileText className="h-5 w-5 text-primary/80"/> Overall Summary
                        </h4>
                        <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.overallSummary)}</p>
                    </div>
                    <Separator/>
                     <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <AlertOctagon className="h-5 w-5 text-destructive/80"/> Risk Assessment
                        </h4>
                        <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.riskAssessment)}</p>
                    </div>
                    <Separator/>
                     <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <Trophy className="h-5 w-5 text-yellow-500/80"/> Key Highlights
                        </h4>
                        <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.keyHighlights)}</p>
                    </div>
                    <Separator/>
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                             <Zap className="h-5 w-5 text-orange-500/80"/> Blockers & Challenges
                        </h4>
                        <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.blockersAndChallenges)}</p>
                    </div>
                     <Separator/>
                    {report.keyFocusAreas && (
                        <>
                            <div className="p-3 rounded-md bg-muted/30">
                                <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                                    <Target className="h-5 w-5 text-red-500/90"/> Key Focus Areas
                                </h4>
                                <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.keyFocusAreas)}</p>
                            </div>
                            <Separator/>
                        </>
                    )}
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                           <Lightbulb className="h-5 w-5 text-green-500/80"/> Actionable Recommendations
                        </h4>
                        <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(report.actionableRecommendations)}</p>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground italic">
                        This report is AI-generated based on current task data and provides a high-level analysis.
                    </p>
                </CardFooter>
            </Card>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
