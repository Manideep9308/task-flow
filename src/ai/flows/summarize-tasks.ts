'use server';

/**
 * @fileOverview AI flow for summarizing a list of tasks.
 *
 * - summarizeTasks - A function that summarizes a list of tasks.
 * - SummarizeTasksInput - The input type for the summarizeTasks function.
 * - SummarizeTasksOutput - The return type for the summarizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTasksInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().describe('The title of the task.'),
        description: z.string().describe('A detailed description of the task.'),
        status: z.string().describe('The current status of the task (e.g., todo, in progress, done).'),
        priority: z.string().describe('The priority of the task (e.g., high, medium, low).'),
        dueDate: z.string().optional().describe('The due date of the task, in ISO format.'),
      })
    )
    .describe('A list of tasks to be summarized.'),
});

export type SummarizeTasksInput = z.infer<typeof SummarizeTasksInputSchema>;

const SummarizeTasksOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the tasks, including overall status, key priorities, and upcoming deadlines.'),
});

export type SummarizeTasksOutput = z.infer<typeof SummarizeTasksOutputSchema>;

export async function summarizeTasks(input: SummarizeTasksInput): Promise<SummarizeTasksOutput> {
  return summarizeTasksFlow(input);
}

const summarizeTasksPrompt = ai.definePrompt({
  name: 'summarizeTasksPrompt',
  input: {schema: SummarizeTasksInputSchema},
  output: {schema: SummarizeTasksOutputSchema},
  prompt: `You are a project manager tasked with summarizing a list of tasks. Provide a concise summary of the tasks, including overall status, key priorities, and upcoming deadlines.

Tasks:
{{#each tasks}}
- Title: {{title}}
  Description: {{description}}
  Status: {{status}}
  Priority: {{priority}}
  {{#if dueDate}}  Due Date: {{dueDate}}
  {{/if}}
{{/each}}
`,
});

const summarizeTasksFlow = ai.defineFlow(
  {
    name: 'summarizeTasksFlow',
    inputSchema: SummarizeTasksInputSchema,
    outputSchema: SummarizeTasksOutputSchema,
  },
  async input => {
    const {output} = await summarizeTasksPrompt(input);
    return output!;
  }
);
