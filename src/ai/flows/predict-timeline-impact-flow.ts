
'use server';
/**
 * @fileOverview An AI flow to predict the impact of a scenario on a project timeline and suggest solutions.
 *
 * - predictTimelineImpact - A function that provides an impact analysis and suggested solutions.
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

const AffectedTaskSchema = z.object({
  taskId: z.string().describe("The ID of an existing task from the 'Current Tasks Overview' list."),
  title: z.string().describe("The original title of the affected task."),
  impact: z.string().describe("A concise description of how this specific task is affected by the scenario (e.g., 'Delayed by 1 week', 'Becomes critical path', 'Risk of overload due to changed dependencies', 'Assignee change might cause ramp-up time')."),
});

const PredictTimelineImpactOutputSchema = z.object({
  impactSummary: z.string().describe('A concise, high-level textual summary of the predicted impact on the project timeline, deadlines, and potential issues.'),
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']).describe("The AI's assessment of the overall risk level introduced by the scenario ('low', 'medium', 'high', or 'unknown')."),
  predictedCompletionDate: z.string().optional().describe("The AI's prediction for the new overall project completion date (e.g., YYYY-MM-DD), if it can be reasonably estimated from the scenario. If not estimable, this field may be omitted or state 'Not clearly estimable'."),
  affectedTasks: z.array(AffectedTaskSchema).optional().describe("A list of specific existing tasks that are significantly impacted by the scenario. This should detail direct consequences on individual tasks."),
  warningsAndConsiderations: z.array(z.string()).optional().describe("A list of general warnings, potential bottlenecks (e.g. resource conflicts if inferable beyond specific tasks), or key considerations the user should be aware of. This is for broader implications not tied to a single task."),
  suggestedSolutions: z.array(z.string()).optional().describe("A list of potential solutions or mitigation strategies for the identified impacts and risks."),
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
3.  **New Predicted Project Completion Date**: If you can reasonably estimate a new overall project completion date based on the scenario and current tasks, provide it in YYYY-MM-DD format. If not clearly estimable, you can omit this field or explicitly state "Not clearly estimable".
4.  **Affected Tasks**: List specific existing tasks that are significantly impacted by the scenario. For each affected task, provide its ID (from the "Current Tasks Overview" list above), its original title, and a concise description of the impact (e.g., "Delayed by 1 week due to [reason]", "Assignee change may cause ramp-up time", "Becomes critical path because [reason]"). If no specific tasks are uniquely affected beyond the general summary, this can be an empty list.
5.  **Warnings and Considerations**: List any general warnings, potential issues (like resource conflicts if inferable beyond specific tasks), or important points the user should consider. This is for broader implications not tied to a single task.
6.  **Suggested Solutions or Mitigation Strategies**: For each major impact, risk, or warning identified, suggest one or more concrete, actionable steps the project manager could take. For example, if a task is critically delayed, suggest options like reallocating resources, descoping related features, or communicating proactively with stakeholders. If resource conflicts arise, suggest specific task reassignments or timeline adjustments.

Focus on logical consequences of the described changes. Do not invent new tasks or make assumptions beyond the provided scenario and task list.
Be concise and actionable in your output. Ensure IDs for affected tasks are accurate from the provided list.
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

