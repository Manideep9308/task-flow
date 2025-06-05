
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Wand2, AlertTriangle, DraftingCompass, Clock, Users, Briefcase, Zap, HelpCircle, BadgeCheck, Settings2, CalendarRange } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { estimateProjectScope, type EstimateProjectScopeInput, type EstimateProjectScopeOutput, type ProjectDesiredQuality, type DetailedTimelineItem, type TeamMemberProfile } from "@/ai/flows/estimate-project-scope-flow";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DESIRED_QUALITY_LEVELS: ProjectDesiredQuality[] = [
  'MVP (Minimum Viable Product)',
  'Polished Product',
  'Enterprise-Grade Solution',
];

export default function ProjectScopingPage() {
  const [projectIdea, setProjectIdea] = useState("");
  const [coreProblem, setCoreProblem] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [desiredQuality, setDesiredQuality] = useState<ProjectDesiredQuality | undefined>(undefined);
  const [existingTeamSize, setExistingTeamSize] = useState<string>("");
  const [specificTechPreferences, setSpecificTechPreferences] = useState("");

  const [estimationResult, setEstimationResult] = useState<EstimateProjectScopeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEstimateScope = async () => {
    if (!projectIdea.trim() || !coreProblem.trim() || !targetAudience.trim() || !keyFeatures.trim()) {
      setError("Please fill in all required fields: Project Idea, Core Problem, Target Audience, and Key Features.");
      setEstimationResult(null);
      return;
    }
    
    let teamSizeNum: number | undefined = undefined;
    if (existingTeamSize.trim()) {
        teamSizeNum = parseInt(existingTeamSize, 10);
        if (isNaN(teamSizeNum) || teamSizeNum < 0) {
            setError("If providing existing team size, it must be a valid positive number.");
            return;
        }
    }


    setIsLoading(true);
    setError(null);
    setEstimationResult(null);

    const input: EstimateProjectScopeInput = {
      projectIdea,
      coreProblem,
      targetAudience,
      keyFeatures,
      desiredQuality: desiredQuality,
      existingTeamSize: teamSizeNum,
      specificTechPreferences: specificTechPreferences.trim() || undefined,
    };

    try {
      const result = await estimateProjectScope(input);
      setEstimationResult(result);
    } catch (e) {
      console.error("Error estimating project scope:", e);
      setError(e instanceof Error ? e.message : "Failed to get AI project scope estimation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderDetailedTimeline = (timeline: DetailedTimelineItem[]) => (
    <Accordion type="multiple" className="w-full space-y-2">
      {timeline.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="bg-muted/30 rounded-md">
          <AccordionTrigger className="px-4 py-3 text-base hover:no-underline">
            <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary/80" />
                <span>{item.phaseOrTaskName} <em className="text-xs text-muted-foreground">({item.estimatedDuration})</em></span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            {item.keyActivities && item.keyActivities.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Key Activities:</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {item.keyActivities.map((activity, actIndex) => (
                    <li key={actIndex}>{activity}</li>
                  ))}
                </ul>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderTeamComposition = (team: TeamMemberProfile[]) => (
    <div className="space-y-3">
      {team.map((member, index) => (
        <Card key={index} className="bg-muted/30">
          <CardHeader className="p-3">
            <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary/80" /> {member.role} (Count: {member.count})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Key Skills:</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {member.keySkills.map((skill, skillIndex) => (
                <li key={skillIndex}>{skill}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto pt-0 pb-8">
      <Card className="shadow-xl mt-2 md:mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DraftingCompass className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">AI Project Scoper & Estimator</CardTitle>
              <CardDescription className="text-md">
                Get a high-level AI-powered estimation for your new project idea.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Section */}
          <div className="space-y-2">
            <Label htmlFor="projectIdea" className="text-base font-medium">Project Idea / Name *</Label>
            <Input id="projectIdea" placeholder="e.g., AI-Powered Recipe Generator App" value={projectIdea} onChange={(e) => setProjectIdea(e.target.value)} disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coreProblem" className="text-base font-medium">Core Problem It Solves *</Label>
            <Textarea id="coreProblem" placeholder="e.g., Users find it hard to decide what to cook based on ingredients they have." value={coreProblem} onChange={(e) => setCoreProblem(e.target.value)} rows={3} disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="text-base font-medium">Primary Target Audience *</Label>
            <Input id="targetAudience" placeholder="e.g., Busy professionals, students, home cooks" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} disabled={isLoading} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keyFeatures" className="text-base font-medium">Key Features & Deliverables (list them) *</Label>
            <Textarea id="keyFeatures" placeholder="e.g., - Ingredient-based recipe search\n- Save favorite recipes\n- AI meal planning suggestions\n- Shopping list generation" value={keyFeatures} onChange={(e) => setKeyFeatures(e.target.value)} rows={5} disabled={isLoading} />
             <p className="text-xs text-muted-foreground flex items-center gap-1"><HelpCircle className="h-3 w-3"/> Provide as much detail as possible for better estimations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="desiredQuality" className="text-base font-medium">Desired Quality Level (Optional)</Label>
                 <Select value={desiredQuality} onValueChange={(value) => setDesiredQuality(value as ProjectDesiredQuality)} disabled={isLoading}>
                    <SelectTrigger id="desiredQuality">
                        <SelectValue placeholder="Select quality level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={UNASSIGNED_FORM_VALUE}><em>None Specified</em></SelectItem>
                        {DESIRED_QUALITY_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="existingTeamSize" className="text-base font-medium">Existing Team Size (Optional)</Label>
                <Input id="existingTeamSize" type="number" placeholder="e.g., 3" value={existingTeamSize} onChange={(e) => setExistingTeamSize(e.target.value)} disabled={isLoading} min="0" />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="specificTechPreferences" className="text-base font-medium">Specific Technology Preferences (Optional)</Label>
            <Input id="specificTechPreferences" placeholder="e.g., Must use Python for backend, Prefer Vue.js" value={specificTechPreferences} onChange={(e) => setSpecificTechPreferences(e.target.value)} disabled={isLoading} />
          </div>


          <Separator />

          <Button onClick={handleEstimateScope} disabled={isLoading || !projectIdea.trim() || !coreProblem.trim() || !targetAudience.trim() || !keyFeatures.trim()} className="w-full md:w-auto text-lg py-3" size="lg">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            Estimate Project Scope with AI
          </Button>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-lg bg-muted/40">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">AI is analyzing your project idea...</p>
              <p className="text-sm text-muted-foreground">This might take a moment for detailed scoping.</p>
            </div>
          )}

          {/* Error Display */}
          {error && !isLoading && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Estimation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {estimationResult && !isLoading && !error && (
            <Card className="mt-6 bg-background shadow-lg border border-primary/30">
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center gap-2">
                  <BadgeCheck className="h-7 w-7" />
                  AI Project Scope Estimation for: "{projectIdea}"
                </CardTitle>
                <CardDescription>
                  Review the AI's high-level estimation below. Remember to use this as a starting point.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Overall Duration */}
                <div className="p-4 border rounded-lg bg-muted/20">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1"><Clock className="h-5 w-5 text-primary/90" /> Overall Estimated Duration:</h3>
                    <p className="text-muted-foreground text-xl font-medium">{estimationResult.overallDurationEstimate}</p>
                </div>
                
                {/* Detailed Timeline */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><CalendarRange className="h-5 w-5 text-primary/90" /> Detailed Timeline Breakdown:</h3>
                  {renderDetailedTimeline(estimationResult.detailedTimeline)}
                </div>

                {/* Team Composition */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-primary/90" /> Suggested Team Composition:</h3>
                  {renderTeamComposition(estimationResult.teamComposition)}
                </div>

                {/* Technology Suggestions */}
                {estimationResult.technologySuggestions && estimationResult.technologySuggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary/90" /> Technology Suggestions:</h3>
                    <div className="p-3 border rounded-md bg-muted/20">
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {estimationResult.technologySuggestions.map((tech, index) => (
                            <li key={index}>{tech}</li>
                        ))}
                        </ul>
                    </div>
                  </div>
                )}

                {/* Potential Risks */}
                {estimationResult.potentialRisks && estimationResult.potentialRisks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Zap className="h-5 w-5 text-destructive/80" /> Potential Risks & Challenges:</h3>
                     <div className="p-3 border rounded-md bg-muted/20">
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {estimationResult.potentialRisks.map((risk, index) => (
                            <li key={index}>{risk}</li>
                        ))}
                        </ul>
                    </div>
                  </div>
                )}
                
                <Separator />

                {/* Summary and Disclaimer */}
                <Alert variant="default" className="border-primary/40 bg-primary/5">
                    <Briefcase className="h-5 w-5 text-primary/80"/>
                    <AlertTitle className="font-semibold text-primary/90">AI Summary & Important Disclaimer</AlertTitle>
                    <AlertDescription className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {estimationResult.summaryAndDisclaimer}
                    </AlertDescription>
                </Alert>

              </CardContent>
               <CardFooter>
                 <p className="text-xs text-muted-foreground italic">
                    This AI estimation provides a high-level starting point. Always combine with detailed human analysis, specific organizational context, and professional judgment for actual project planning and commitments.
                 </p>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const UNASSIGNED_FORM_VALUE = "__NONE__"; // Used for the select item if user wants "None Specified"
