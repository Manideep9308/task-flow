
'use server';
/**
 * @fileOverview An AI flow to identify and report potential risks from a list of tasks.
 *
 * - generateRiskRadar - A function that analyzes tasks and outputs a list of risks.
 * - RiskRadarInput - The input type for the function.
 * - RiskRadarOutput - The return type for the function.
 * - RiskItem - A single identified risk.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskStatus, TaskPriority, TaskSnapshot } from '@/lib/types';

const TaskSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.custom<TaskStatus>(),
  priority: z.custom<TaskPriority>(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
});

const RiskRadarInputSchema = z.object({
  tasks: z.array(TaskSnapshotSchema).describe("A list of all current tasks for the project."),
});
export type RiskRadarInput = z.infer<typeof RiskRadarInputSchema>;

const RiskItemSchema = z.object({
  description: z.string().describe("A concise description of the identified risk."),
  level: z.enum(['High', 'Medium', 'Low']).describe("The assessed severity of the risk."),
  relatedTaskId: z.string().optional().describe("The ID of the task most directly related to this risk, if applicable."),
  relatedTaskTitle: z.string().optional().describe("The title of the task most directly related to this risk, if applicable."),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

const RiskRadarOutputSchema = z.object({
  risks: z.array(RiskItemSchema).max(3).describe("A list of the top 2-3 most critical risks identified. If no significant risks, this can be an empty array."),
});
export type RiskRadarOutput = z.infer<typeof RiskRadarOutputSchema>;

export async function generateRiskRadar(input: RiskRadarInput): Promise<RiskRadarOutput> {
  return generateRiskRadarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRiskRadarPrompt',
  input: {schema: RiskRadarInputSchema},
  output: {schema: RiskRadarOutputSchema},
  prompt: `You are an expert project risk analyst. Analyze the following list of tasks and identify the top 2-3 most critical risks to the project's success or timeline.
For each risk, provide a concise description, assess its severity level ('High', 'Medium', or 'Low'), and if the risk is directly tied to a specific task, provide that task's ID and title.

Consider the following factors when identifying risks:
- Overdue tasks, especially those with high priority.
- High-priority tasks with upcoming due dates that are not yet 'inprogress' or 'done'.
- Tasks with descriptions or titles containing keywords like "blocker", "urgent", "critical", "issue", "problem" that appear unaddressed given their status.
- Potential bottlenecks (e.g., too many high-priority tasks on one assignee, though assignee names are not directly provided, use patterns if observable).
- Tasks that have been in 'todo' or 'inprogress' for an unusually long time (if inferable, otherwise focus on current state relative to due dates).

Tasks:
{{#each tasks}}
- Task: "{{{title}}}" (ID: {{{id}}})
  Status: {{{status}}}
  Priority: {{{priority}}}
  {{#if dueDate}}Due: {{{dueDate}}}{{/if}}
  {{#if assignedTo}}Assigned To: User ID {{{assignedTo}}}{{/if}}
  {{#if category}}Category: {{{category}}}{{/if}}
  {{#if description}}Description: {{{description}}}{{/if}}
{{/each}}

Please structure your output as a list of risks. Focus on the most impactful ones. If no significant risks are identified, return an empty list.
`,
});

const generateRiskRadarFlow = ai.defineFlow(
  {
    name: 'generateRiskRadarFlow',
    inputSchema: RiskRadarInputSchema,
    outputSchema: RiskRadarOutputSchema,
  },
  async (input) => {
    if (!input.tasks || input.tasks.length === 0) {
      return { risks: [] }; // No tasks, no risks
    }
    const {output} = await prompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit if the prompt fails,
      // but as a fallback, we return an empty list.
      return { risks: [] };
    }
    return output;
  }
);

