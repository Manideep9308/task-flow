
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Wand2, AlertTriangle, Lightbulb, HelpCircle, SearchCheck, Eye, MessageSquareQuote, Shuffle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateProjectPremise, type ValidateProjectPremiseInput, type ValidateProjectPremiseOutput, type ValidationSection } from "@/ai/flows/validate-project-premise-flow";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, React.ElementType> = {
  "Potential Blind Spots": Eye,
  "Challenging Questions": MessageSquareQuote,
  "Potential Risks": AlertTriangle,
  "Alternative Perspectives": Shuffle,
};


export default function IdeaValidatorPage() {
  const [projectIdea, setProjectIdea] = useState("");
  const [coreProblemSolved, setCoreProblemSolved] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyGoals, setKeyGoals] = useState<string[]>([""]);

  const [validationResult, setValidationResult] = useState<ValidateProjectPremiseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyGoalChange = (index: number, value: string) => {
    const updatedGoals = [...keyGoals];
    updatedGoals[index] = value;
    setKeyGoals(updatedGoals);
  };

  const addKeyGoalField = () => {
    setKeyGoals([...keyGoals, ""]);
  };

  const removeKeyGoalField = (index: number) => {
    if (keyGoals.length > 1) {
      const updatedGoals = keyGoals.filter((_, i) => i !== index);
      setKeyGoals(updatedGoals);
    }
  };

  const handleValidateIdea = async () => {
    if (!projectIdea.trim() || !coreProblemSolved.trim() || !targetAudience.trim() || keyGoals.some(g => !g.trim())) {
      setError("Please fill in all required fields: Project Idea, Core Problem, Target Audience, and at least one Key Goal.");
      setValidationResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    const input: ValidateProjectPremiseInput = {
      projectIdea,
      coreProblemSolved,
      targetAudience,
      keyGoals: keyGoals.filter(g => g.trim()),
    };

    try {
      const result = await validateProjectPremise(input);
      setValidationResult(result);
    } catch (e) {
      console.error("Error validating project premise:", e);
      setError(e instanceof Error ? e.message : "Failed to get AI validation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderValidationSection = (section: ValidationSection | undefined, defaultTitle: string) => {
    if (!section || !section.points || section.points.length === 0) {
      return (
        <AccordionItem value={defaultTitle.toLowerCase().replace(/\s+/g, '-')}>
          <AccordionTrigger className="text-lg hover:no-underline">
             <div className="flex items-center gap-2">
                {React.createElement(iconMap[section?.title || defaultTitle] || HelpCircle, { className: "h-5 w-5 text-primary/80" })}
                {section?.title || defaultTitle}
             </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground italic px-2 py-1">AI did not provide specific points for this section.</p>
          </AccordionContent>
        </AccordionItem>
      );
    }
    
    const IconComponent = iconMap[section.title] || HelpCircle;

    return (
      <AccordionItem value={section.title.toLowerCase().replace(/\s+/g, '-')}>
        <AccordionTrigger className="text-lg hover:no-underline">
            <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-primary/80" />
                {section.title}
            </div>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
            {section.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    );
  };


  return (
    <div className="container mx-auto pt-0 pb-8">
      <Card className="shadow-xl mt-2 md:mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">AI Idea Validator & Stress Test</CardTitle>
              <CardDescription className="text-md">
                Get critical feedback on your project ideas before diving in.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectIdea" className="text-base font-medium">Your Project Idea / Name</Label>
            <Input
              id="projectIdea"
              placeholder="e.g., A social network for pet owners"
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coreProblemSolved" className="text-base font-medium">Core Problem It Solves</Label>
            <Textarea
              id="coreProblemSolved"
              placeholder="e.g., Pet owners often feel isolated and need a community for support and advice."
              value={coreProblemSolved}
              onChange={(e) => setCoreProblemSolved(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="text-base font-medium">Primary Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="e.g., First-time dog owners, cat enthusiasts in urban areas"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Key Goals/Objectives (at least one)</Label>
            {keyGoals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Goal ${index + 1}`}
                  value={goal}
                  onChange={(e) => handleKeyGoalChange(index, e.target.value)}
                  disabled={isLoading}
                  className="flex-grow"
                />
                {keyGoals.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeyGoalField(index)}
                    disabled={isLoading}
                    title="Remove goal"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyGoalField}
              disabled={isLoading}
              className="mt-1"
            >
              Add Another Goal
            </Button>
          </div>

          <Separator />

          <Button
            onClick={handleValidateIdea}
            disabled={isLoading || !projectIdea.trim() || !coreProblemSolved.trim() || !targetAudience.trim() || !keyGoals.some(g => g.trim())}
            className="w-full md:w-auto text-lg py-3"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Validate Idea with AI
          </Button>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">AI is analyzing your idea...</p>
              <p className="text-sm text-muted-foreground">This might take a moment.</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationResult && !isLoading && !error && (
            <Card className="mt-6 bg-card shadow-lg border border-primary/30">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <SearchCheck className="h-6 w-6" />
                    AI Validation Insights for: "{projectIdea}"
                </CardTitle>
                <CardDescription>
                  Review the AI's feedback to strengthen your project premise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full space-y-2">
                  {renderValidationSection(validationResult.potentialBlindSpots, "Potential Blind Spots")}
                  {renderValidationSection(validationResult.challengingQuestions, "Challenging Questions")}
                  {renderValidationSection(validationResult.potentialRisks, "Potential Risks")}
                  {renderValidationSection(validationResult.alternativePerspectives, "Alternative Perspectives")}
                </Accordion>
              </CardContent>
               <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    This AI analysis provides high-level feedback. Always combine with your own research and judgment.
                 </p>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
