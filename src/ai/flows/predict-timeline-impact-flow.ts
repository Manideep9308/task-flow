
'use server';
/**
 * @fileOverview An AI flow to predict the impact of a scenario on a project timeline.
 *
 * - predictTimelineImpact - A function that provides an impact analysis.
 * - PredictTimelineImpactInput - The input type for the predictTimelineImpact function.
 * - PredictTimelineImpactOutput - The return type for the predictTimelineImpact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskStatus, TaskPriority } from '@/lib/types'; // Assuming these are defined in lib/types

const TaskSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.custom<TaskStatus>(), // Use the actual TaskStatus type
  priority: z.custom<TaskPriority>(), // Use the actual TaskPriority type
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

const PredictTimelineImpactInputSchema = z.object({
  currentTasks: z.array(TaskSnapshotSchema).describe("An array of current tasks with their key details."),
  scenarioDescription: z.string().describe("A textual description of the 'what-if' scenario to be simulated (e.g., 'Delay Task X by 1 week and assign Task Y to User A')."),
});
export type PredictTimelineImpactInput = z.infer<typeof PredictTimelineImpactInputSchema>;

const PredictTimelineImpactOutputSchema = z.object({
  impactSummary: z.string().describe('A concise, high-level textual summary of the predicted impact on the project timeline, deadlines, and potential issues.'),
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']).describe("The AI's assessment of the overall risk level introduced by the scenario ('low', 'medium', 'high', or 'unknown')."),
  warningsAndConsiderations: z.array(z.string()).optional().describe("A list of specific warnings, potential bottlenecks, resource conflicts, or key considerations the user should be aware of. This could include tasks at risk, or areas needing closer monitoring."),
});
export type PredictTimelineImpactOutput = z.infer<typeof PredictTimelineImpactOutputSchema>;

export async function predictTimelineImpact(input: PredictTimelineImpactInput): Promise<PredictTimelineImpactOutput> {
  return predictTimelineImpactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictTimelineImpactPrompt',
  input: {schema: PredictTimelineImpactInputSchema},
  output: {schema: PredictTimelineImpactOutputSchema},
  prompt: `You are a project management assistant AI. Analyze the provided list of current tasks and the described "what-if" scenario.
Based on this information, predict the potential impact on the project timeline.

Current Tasks Overview:
{{#each currentTasks}}
- Task: {{{title}}} (ID: {{{id}}})
  Status: {{{status}}}
  Priority: {{{priority}}}
  {{#if dueDate}}Due: {{{dueDate}}}{{/if}}
  {{#if assignedTo}}Assigned To: {{{assignedTo}}}{{/if}}
  {{#if description}}Description: {{{description}}}{{/if}}
{{/each}}

Scenario to Simulate:
"{{{scenarioDescription}}}"

Based on the scenario, provide:
1.  **Impact Summary**: A brief, high-level summary of how this scenario might affect the project's overall timeline and key objectives.
2.  **Risk Level**: Assess the overall risk to the project as 'low', 'medium', or 'high'. If uncertain, use 'unknown'.
3.  **Warnings and Considerations**: List any specific warnings, potential issues (like tasks becoming critical, resource conflicts if inferable), or important points the user should consider. If none, this can be an empty list.

Focus on logical consequences of the described changes. Do not invent new tasks or make assumptions beyond the provided scenario and task list.
For example, if a critical task is delayed, mention that. If a user is assigned more work in the scenario, you might note a potential increase in their workload.
Be concise and actionable in your output.
`,
});

const predictTimelineImpactFlow = ai.defineFlow(
  {
    name: 'predictTimelineImpactFlow',
    inputSchema: PredictTimelineImpactInputSchema,
    outputSchema: PredictTimelineImpactOutputSchema,
  },
  async (input) => {
    if (!input.currentTasks || input.currentTasks.length === 0) {
      return {
        impactSummary: "No current tasks provided to analyze the scenario against. Please ensure tasks are loaded.",
        riskLevel: "unknown",
        warningsAndConsiderations: ["Cannot predict impact without task data."],
      };
    }
    if (!input.scenarioDescription.trim()) {
      return {
        impactSummary: "No scenario description provided. Please describe what you'd like to simulate.",
        riskLevel: "unknown",
        warningsAndConsiderations: ["Scenario description is empty."],
      };
    }

    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to predict timeline impact.');
    }
    return output;
  }
);
