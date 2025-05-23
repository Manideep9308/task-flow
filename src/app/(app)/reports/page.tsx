
"use client";

import React from "react"; // Added React import
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, AlertTriangle, FileText, BarChart3, Zap, Lightbulb, AlertOctagon, Trophy, CheckCircle, Target, History, Activity, Brain } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTasks } from "@/contexts/task-context";
import type { ProjectTaskSnapshot, GenerateProjectHealthReportOutput, GenerateProjectHealthReportInput, RetrospectiveReportOutput, GenerateRetrospectiveReportInput } from "@/lib/types";
import { generateProjectHealthReport } from "@/ai/flows/generate-project-health-report-flow";
import { generateRetrospectiveReport } from "@/ai/flows/generate-retrospective-report-flow";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';

export default function ReportsPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [healthReport, setHealthReport] = useState<GenerateProjectHealthReportOutput | null>(null);
  const [isLoadingHealthReport, setIsLoadingHealthReport] = useState(false);
  const [healthReportError, setHealthReportError] = useState<string | null>(null);

  const [retrospectiveReport, setRetrospectiveReport] = useState<RetrospectiveReportOutput | null>(null);
  const [isLoadingRetrospective, setIsLoadingRetrospective] = useState(false);
  const [retrospectiveError, setRetrospectiveError] = useState<string | null>(null);


  const handleGenerateHealthReport = async () => {
    setIsLoadingHealthReport(true);
    setHealthReportError(null);
    setHealthReport(null); // Clear previous report

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
      projectName: "TaskFlow Project (Demo)",
      reportDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      const result = await generateProjectHealthReport(input);
      setHealthReport(result);
    } catch (e) {
      console.error("Error generating project health report:", e);
      setHealthReportError(e instanceof Error ? e.message : "Failed to generate health report. Please try again.");
    } finally {
      setIsLoadingHealthReport(false);
    }
  };

  const handleGenerateRetrospective = async () => {
    setIsLoadingRetrospective(true);
    setRetrospectiveError(null);
    setRetrospectiveReport(null); // Clear previous report

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

    const input: GenerateRetrospectiveReportInput = {
      tasks: mappedTasks,
      projectName: "TaskFlow Project (Demo)",
      projectEndDate: format(new Date(), "yyyy-MM-dd"), // Assuming project conceptually "ends" today for the mock
    };

    try {
      const result = await generateRetrospectiveReport(input);
      setRetrospectiveReport(result);
    } catch (e) {
      console.error("Error generating retrospective report:", e);
      setRetrospectiveError(e instanceof Error ? e.message : "Failed to generate retrospective report. Please try again.");
    } finally {
      setIsLoadingRetrospective(false);
    }
  };


  const renderFormattedText = (text: string | undefined | null): React.ReactNode => {
    if (!text) return null;
  
    // Split by explicit escaped newlines from AI or actual newlines
    const lines = text.split(/\\n|\n/);
  
    return lines.map((line, index) => {
      // Further process each line for potential bullet points or other formatting
      const trimmedLine = line.trim();
      let lineContent: React.ReactNode = trimmedLine;
  
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
        // Simple bullet point handling
        lineContent = <span className="flex"><span className="mr-2">{trimmedLine.substring(0, 2)}</span><span>{trimmedLine.substring(2)}</span></span>;
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        // Simple numbered list item handling
        const parts = trimmedLine.match(/^(\d+\.)\s*(.*)/);
        if (parts) {
          lineContent = <span className="flex"><span className="mr-2">{parts[1]}</span><span>{parts[2]}</span></span>;
        }
      }
  
      return (
        <React.Fragment key={index}>
          {lineContent}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };


  return (
    <div className="container mx-auto space-y-8 pt-0">
      <Card className="shadow-xl mt-2 md:mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Insights & Reports</CardTitle>
              <CardDescription className="text-md">
                Generate AI-powered reports for your project based on current task data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={handleGenerateHealthReport}
              disabled={isLoadingHealthReport || tasksLoading || tasks.length === 0 || isLoadingRetrospective}
              className="w-full text-base py-2.5"
              size="lg"
            >
              {isLoadingHealthReport ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Activity className="mr-2 h-5 w-5" />
              )}
              Generate Project Health Report
            </Button>
            <Button
              onClick={handleGenerateRetrospective}
              disabled={isLoadingRetrospective || tasksLoading || tasks.length === 0 || isLoadingHealthReport}
              className="w-full text-base py-2.5"
              size="lg"
            >
              {isLoadingRetrospective ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <History className="mr-2 h-5 w-5" />
              )}
              Generate Retrospective Report
            </Button>
          </div>
          
          {tasksLoading && !isLoadingHealthReport && !isLoadingRetrospective && (
             <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading task data...
             </div>
          )}

          {!tasksLoading && tasks.length === 0 && !isLoadingHealthReport && !isLoadingRetrospective &&(
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Tasks Available</AlertTitle>
              <AlertDescription>
                Cannot generate reports as there are no tasks in the project. Please add some tasks first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {/* Health Report Section */}
        {isLoadingHealthReport && (
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">Generating health report...</p>
            </div>
          </CardContent>
        )}
        {healthReportError && !isLoadingHealthReport && (
          <CardContent>
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Health Report Error</AlertTitle>
              <AlertDescription>{healthReportError}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        {healthReport && !isLoadingHealthReport && !healthReportError && (
          <CardContent className="space-y-6 pt-6">
            <Card className="bg-card shadow-lg border border-primary/30">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-primary">
                            Project Health Report
                            {healthReport.projectName && ` for ${healthReport.projectName}`}
                        </CardTitle>
                        {healthReport.reportDate && (
                            <span className="text-sm text-muted-foreground">
                                Generated: {format(new Date(healthReport.reportDate), "PPP")}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <FileText className="h-5 w-5 text-primary/80"/> Overall Summary
                        </h4>
                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.overallSummary)}</div>
                    </div>
                    <Separator/>
                     <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <AlertOctagon className="h-5 w-5 text-destructive/80"/> Risk Assessment
                        </h4>
                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.riskAssessment)}</div>
                    </div>
                    <Separator/>
                     <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                            <Trophy className="h-5 w-5 text-yellow-500/80"/> Key Highlights
                        </h4>
                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.keyHighlights)}</div>
                    </div>
                    <Separator/>
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                             <Zap className="h-5 w-5 text-orange-500/80"/> Blockers & Challenges
                        </h4>
                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.blockersAndChallenges)}</div>
                    </div>
                     <Separator/>
                    {healthReport.keyFocusAreas && (
                        <>
                            <div className="p-3 rounded-md bg-muted/30">
                                <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                                    <Target className="h-5 w-5 text-red-500/90"/> Key Focus Areas
                                </h4>
                                <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.keyFocusAreas)}</div>
                            </div>
                            <Separator/>
                        </>
                    )}
                    <div className="p-3 rounded-md bg-muted/30">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-1">
                           <Lightbulb className="h-5 w-5 text-green-500/80"/> Actionable Recommendations
                        </h4>
                        <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(healthReport.actionableRecommendations)}</div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground italic">
                        This AI-generated health report provides a high-level analysis based on current task data.
                    </p>
                </CardFooter>
            </Card>
          </CardContent>
        )}

        {/* Retrospective Report Section */}
        {isLoadingRetrospective && (
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">Generating retrospective report...</p>
            </div>
          </CardContent>
        )}
        {retrospectiveError && !isLoadingRetrospective && (
          <CardContent>
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Retrospective Report Error</AlertTitle>
              <AlertDescription>{retrospectiveError}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        {retrospectiveReport && !isLoadingRetrospective && !retrospectiveError && (
          <CardContent className="space-y-6 pt-6">
            <Card className="bg-card shadow-lg border border-purple-500/30">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-purple-400">
                    Retrospective Report
                    {retrospectiveReport.projectName && ` for ${retrospectiveReport.projectName}`}
                  </CardTitle>
                  {retrospectiveReport.projectEndDate && (
                    <span className="text-sm text-muted-foreground">
                      Project End Date (Conceptual): {format(new Date(retrospectiveReport.projectEndDate), "PPP")}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-md bg-muted/30">
                  <h4 className="font-semibold text-lg flex items-center gap-2 mb-1 text-green-400">
                    <CheckCircle className="h-5 w-5"/> What Went Well
                  </h4>
                  <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(retrospectiveReport.wentWell)}</div>
                </div>
                <Separator/>
                <div className="p-3 rounded-md bg-muted/30">
                  <h4 className="font-semibold text-lg flex items-center gap-2 mb-1 text-orange-400">
                    <AlertTriangle className="h-5 w-5"/> Challenges / What Didn't Go Well
                  </h4>
                  <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(retrospectiveReport.challenges)}</div>
                </div>
                <Separator/>
                <div className="p-3 rounded-md bg-muted/30">
                  <h4 className="font-semibold text-lg flex items-center gap-2 mb-1 text-blue-400">
                    <Brain className="h-5 w-5"/> Learnings & Improvement Suggestions
                  </h4>
                  <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(retrospectiveReport.learningsAndImprovements)}</div>
                </div>
                {retrospectiveReport.overallProjectSentiment && (
                  <>
                    <Separator/>
                    <div className="p-3 rounded-md bg-muted/30">
                      <h4 className="font-semibold text-lg flex items-center gap-2 mb-1 text-teal-400">
                        <Activity className="h-5 w-5"/> Overall Project Sentiment
                      </h4>
                      <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">{renderFormattedText(retrospectiveReport.overallProjectSentiment)}</div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground italic">
                  This AI-generated retrospective offers insights based on the provided task data, assuming a project conclusion.
                </p>
              </CardFooter>
            </Card>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
