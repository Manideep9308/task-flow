
'use server';
/**
 * @fileOverview An AI flow to estimate project scope, duration, team, and risks.
 *
 * - estimateProjectScope - Analyzes a project idea and provides high-level estimations.
 * - EstimateProjectScopeInput - Input type for the function.
 * - EstimateProjectScopeOutput - Return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {
  EstimateProjectScopeInput,
  EstimateProjectScopeOutput,
  DetailedTimelineItem,
  TeamMemberProfile,
  ProjectDesiredQuality,
} from '@/lib/types';

const ProjectDesiredQualityEnum = z.enum([
  'MVP (Minimum Viable Product)',
  'Polished Product',
  'Enterprise-Grade Solution',
]);

const EstimateProjectScopeInputSchema = z.object({
  projectIdea: z.string().min(10).describe('A concise name or high-level description of the project idea.'),
  coreProblem: z.string().min(20).describe('The core problem this project aims to solve for its users.'),
  targetAudience: z.string().min(10).describe('The primary target audience or user group for this project.'),
  keyFeatures: z.string().min(30).describe('A list or detailed description of the key features, functionalities, or deliverables of the project. The more detail, the better the estimation.'),
  desiredQuality: ProjectDesiredQualityEnum.optional().describe("The desired level of quality and polish for the final product (e.g., 'MVP', 'Polished Product', 'Enterprise-Grade Solution'). This influences effort."),
  existingTeamSize: z.number().int().positive().optional().describe('The number of people already available on the team, if any. Helps ground team size suggestions.'),
  specificTechPreferences: z.string().optional().describe('Any specific technologies or platforms the user prefers or is required to use (e.g., "Must use Python for backend", "Prefer React for frontend").'),
});

const DetailedTimelineItemSchema = z.object({
  phaseOrTaskName: z.string().describe("Name of the high-level project phase or major epic/task (e.g., 'Discovery & Planning', 'UI/UX Design', 'Frontend Development', 'API Development', 'Testing & QA', 'Deployment')."),
  estimatedDuration: z.string().describe("Estimated duration for this phase/task (e.g., '2-3 weeks', 'approx. 1 month', '15-20 working days')."),
  description: z.string().describe("A brief summary of what this phase or epic entails."),
  keyActivities: z.array(z.string()).describe("A few bullet points of key activities or sub-tasks within this phase/epic."),
});

const TeamMemberProfileSchema = z.object({
  role: z.string().describe("The role of the team member (e.g., 'Project Manager', 'Frontend Developer', 'Backend Developer', 'UX/UI Designer', 'QA Engineer')."),
  count: z.number().int().min(0).describe("The number of people suggested for this role. Can be fractional (e.g., 0.5 for part-time)."),
  keySkills: z.array(z.string()).describe("Key skills required for this role in the context of the project."),
});

const EstimateProjectScopeOutputSchema = z.object({
  overallDurationEstimate: z.string().describe("A high-level estimate of the total project duration (e.g., '3-6 months', 'Approximately 90 working days')."),
  detailedTimeline: z.array(DetailedTimelineItemSchema).min(3).describe("A breakdown of the project into 3-7 major phases or epics, each with an estimated duration, description, and key activities. The sum of these phase durations should conceptually align with the overallDurationEstimate."),
  teamComposition: z.array(TeamMemberProfileSchema).min(1).describe("Suggested team composition, including roles, number of people for each role, and key skills needed."),
  technologySuggestions: z.array(z.string()).describe("Suggestions for key technologies or platforms that might be suitable for this project, considering any user preferences."),
  potentialRisks: z.array(z.string()).min(2).describe("A list of 2-4 high-level potential risks or challenges for this type of project."),
  summaryAndDisclaimer: z.string().describe("A brief overall summary of the estimation, followed by a strong disclaimer stating that this is a high-level AI-generated estimate for preliminary planning purposes only and should not be considered a definitive project plan. Real-world factors can significantly alter actuals."),
});

export async function estimateProjectScope(input: EstimateProjectScopeInput): Promise<EstimateProjectScopeOutput> {
  return estimateProjectScopeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateProjectScopePrompt',
  input: {schema: EstimateProjectScopeInputSchema},
  output: {schema: EstimateProjectScopeOutputSchema},
  prompt: `You are an expert Senior Project Manager and Solutions Architect. Your task is to provide a comprehensive, high-level estimation for a new software project based on the details provided.

Project Details:
- Idea/Name: {{{projectIdea}}}
- Core Problem to Solve: {{{coreProblem}}}
- Target Audience: {{{targetAudience}}}
- Key Features/Deliverables: {{{keyFeatures}}}
{{#if desiredQuality}}- Desired Quality Level: {{{desiredQuality}}}{{/if}}
{{#if existingTeamSize}}- Current Available Team Size: {{{existingTeamSize}}} people{{/if}}
{{#if specificTechPreferences}}- Specific Technology Preferences/Requirements: {{{specificTechPreferences}}}{{/if}}

Based on these details, please provide the following estimations:

1.  **Overall Duration Estimate**: A high-level estimate of the total project duration (e.g., "3-6 months", "Approximately 90 working days").

2.  **Detailed Timeline Breakdown**:
    *   Break the project into 3-7 major, logical phases or epics (e.g., Discovery & Planning, UI/UX Design, Backend Development, Frontend Development, Integration, Testing & QA, Deployment & Launch, Post-launch Support).
    *   For each phase/epic:
        *   Provide a clear `phaseOrTaskName`.
        *   Estimate its `estimatedDuration` (e.g., "2-3 weeks", "approx. 1 month").
        *   Write a brief `description` of what this phase/epic generally entails.
        *   List 2-3 `keyActivities` (bullet points) within this phase/epic.
    *   The sum of these phase durations should conceptually align with your overall duration estimate.

3.  **Team Composition**:
    *   Suggest a realistic team structure.
    *   For each `role` (e.g., Project Manager, Frontend Developer, Backend Developer, UI/UX Designer, QA Engineer):
        *   Estimate the `count` of people needed (can be fractional like 0.5 for part-time involvement if appropriate).
        *   List 2-3 `keySkills` required for that role specific to this project.
    *   Consider the optional `existingTeamSize` if provided, and suggest additions or if the current size is sufficient.

4.  **Technology Suggestions**:
    *   Recommend a few key technologies or platforms (e.g., programming languages, frameworks, cloud services) that would be suitable for building this project.
    *   Acknowledge and incorporate any `specificTechPreferences` if provided by the user.

5.  **Potential Risks**:
    *   Identify 2-4 high-level potential risks or challenges commonly associated with this type of project or based on the provided details (e.g., scope creep, integration complexities, user adoption challenges, technical debt if rushing an MVP).

6.  **Summary and Disclaimer**:
    *   Start with a brief (1-2 sentence) overall summary of your estimation.
    *   Conclude with a **CRITICAL DISCLAIMER**: "This is a high-level, AI-generated estimate intended for preliminary planning and discussion purposes only. It does not account for all real-world complexities, specific organizational contexts, or unforeseen challenges. Actual project duration, team needs, and costs can vary significantly. This estimate should not be used as a definitive project plan or for binding commitments without further detailed analysis and professional consultation."

Be realistic and base your estimations on common industry practices for software development projects of varying quality levels if specified. If `desiredQuality` is 'MVP', estimations should be leaner. If 'Enterprise-Grade', estimations should account for more rigor, scalability, and robustness.
Ensure your output strictly adheres to the JSON schema.
The 'detailedTimeline' should contain at least 3 distinct phases.
The 'teamComposition' should list at least one role.
The 'potentialRisks' should list at least 2 distinct risks.
`,
});

const estimateProjectScopeFlow = ai.defineFlow(
  {
    name: 'estimateProjectScopeFlow',
    inputSchema: EstimateProjectScopeInputSchema,
    outputSchema: EstimateProjectScopeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate project scope estimation.');
    }
    // Ensure the disclaimer is always present and robust, even if AI somehow omits it
    const standardDisclaimer = "This is a high-level, AI-generated estimate intended for preliminary planning and discussion purposes only. It does not account for all real-world complexities, specific organizational contexts, or unforeseen challenges. Actual project duration, team needs, and costs can vary significantly. This estimate should not be used as a definitive project plan or for binding commitments without further detailed analysis and professional consultation.";
    if (!output.summaryAndDisclaimer || !output.summaryAndDisclaimer.includes("high-level, AI-generated estimate")) {
        output.summaryAndDisclaimer = (output.summaryAndDisclaimer ? output.summaryAndDisclaimer + "\n\n" : "") + standardDisclaimer;
    }
    
    return output;
  }
);
