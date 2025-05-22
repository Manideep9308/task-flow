
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, AlertTriangle, GanttChartSquare, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTasks } from "@/contexts/task-context";
import type { Task } from "@/lib/types";
import { predictTimelineImpact, type PredictTimelineImpactInput, type PredictTimelineImpactOutput } from "@/ai/flows/predict-timeline-impact-flow";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TimeTravelPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [prediction, setPrediction] = useState<PredictTimelineImpactOutput | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handlePredictImpact = async () => {
    if (!scenarioDescription.trim()) {
      setPredictionError("Please describe a scenario to simulate.");
      setPrediction(null);
      return;
    }

    setIsLoadingPrediction(true);
    setPredictionError(null);
    setPrediction(null);

    const input: PredictTimelineImpactInput = {
      currentTasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo,
        description: t.description,
      })),
      scenarioDescription: scenarioDescription,
    };

    try {
      const result = await predictTimelineImpact(input);
      setPrediction(result);
    } catch (e) {
      console.error("Error predicting timeline impact:", e);
      setPredictionError(e instanceof Error ? e.message : "Failed to get AI prediction. Please try again.");
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string | undefined) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'default'; // Default often green-ish or primary
      case 'medium':
        return 'secondary'; // Secondary often yellow/orange-ish
      case 'high':
        return 'destructive'; // Destructive is red
      default:
        return 'outline';
    }
  };


  return (
    <div className="container mx-auto space-y-8 pt-0">
      <Card className="shadow-xl mt-2 md:mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <GanttChartSquare className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Task Time Travel Simulation</CardTitle>
              <CardDescription className="text-md">
                Experiment with timeline changes and predict outcomes without affecting live data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="scenarioDescription" className="block text-sm font-medium text-foreground mb-1">
              Describe Your "What-If" Scenario:
            </label>
            <Textarea
              id="scenarioDescription"
              placeholder="e.g., 'Delay Task Alpha by 1 week', 'Assign Task Beta to Bob instead of Alice and reduce its priority to low', 'What if the design phase takes 5 extra days?'"
              value={scenarioDescription}
              onChange={(e) => setScenarioDescription(e.target.value)}
              rows={4}
              className="max-h-40"
              disabled={isLoadingPrediction || tasksLoading}
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <HelpCircle className="h-3 w-3"/> Be specific about tasks, changes, and team members for better predictions.
            </p>
          </div>

          <Button
            onClick={handlePredictImpact}
            disabled={isLoadingPrediction || tasksLoading || !scenarioDescription.trim()}
            className="w-full md:w-auto text-base py-2.5"
            size="lg"
          >
            {isLoadingPrediction ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Predict Impact
          </Button>

          {isLoadingPrediction && (
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">Analyzing scenario and predicting impact...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments.</p>
            </div>
          )}

          {predictionError && !isLoadingPrediction && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Prediction Error</AlertTitle>
              <AlertDescription>{predictionError}</AlertDescription>
            </Alert>
          )}

          {prediction && !isLoadingPrediction && !predictionError && (
            <Card className="mt-6 bg-card shadow-lg border border-primary/30">
              <CardHeader>
                <CardTitle className="text-xl text-primary">AI Predicted Impact Analysis</CardTitle>
                <CardDescription>Based on your scenario: "{scenarioDescription.length > 100 ? scenarioDescription.substring(0,97) + '...' : scenarioDescription}"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">Overall Impact Summary:</h4>
                  <p className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{prediction.impactSummary}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg inline-flex items-center gap-2">
                    Predicted Risk Level:
                    <Badge variant={getRiskBadgeVariant(prediction.riskLevel)} className="text-sm px-2 py-0.5 capitalize">
                      {prediction.riskLevel || "Unknown"}
                    </Badge>
                  </h4>
                </div>

                {prediction.warningsAndConsiderations && prediction.warningsAndConsiderations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg">Key Warnings & Considerations:</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/30">
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {prediction.warningsAndConsiderations.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
                 {!prediction.warningsAndConsiderations || prediction.warningsAndConsiderations.length === 0 && (
                    <p className="text-sm text-muted-foreground">No specific warnings or considerations highlighted by the AI for this scenario.</p>
                )}
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    Note: This is a conceptual simulation. For critical decisions, always cross-verify with detailed planning.
                 </p>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
