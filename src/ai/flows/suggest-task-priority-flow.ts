
'use server';
/**
 * @fileOverview An AI flow to suggest task priority based on its details.
 *
 * - suggestTaskPriority - A function that provides a suggested priority and reasoning.
 * - SuggestTaskPriorityInput - The input type for the suggestTaskPriority function.
 * - SuggestTaskPriorityOutput - The return type for the suggestTaskPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskPriority } from '@/lib/types';
import { TASK_PRIORITIES } from '@/lib/constants';

const SuggestTaskPriorityInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
  taskDescription: z.string().optional().describe('The description of the task.'),
  currentPriority: z.custom<TaskPriority>((val) => TASK_PRIORITIES.map(p => p.value).includes(val as TaskPriority)).describe("The task's current priority."),
  dueDate: z.string().optional().describe('The due date of the task (YYYY-MM-DD), if any.'),
});
export type SuggestTaskPriorityInput = z.infer<typeof SuggestTaskPriorityInputSchema>;

const SuggestTaskPriorityOutputSchema = z.object({
  suggestedPriority: z.custom<TaskPriority>((val) => TASK_PRIORITIES.map(p => p.value).includes(val as TaskPriority), {
    message: "Invalid priority. Must be 'low', 'medium', or 'high'.",
  }).describe("The AI's suggested priority for the task ('low', 'medium', or 'high')."),
  reasoning: z.string().describe('A brief explanation for the suggested priority.'),
});
export type SuggestTaskPriorityOutput = z.infer<typeof SuggestTaskPriorityOutputSchema>;

export async function suggestTaskPriority(input: SuggestTaskPriorityInput): Promise<SuggestTaskPriorityOutput> {
  return suggestTaskPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPriorityPrompt',
  input: {schema: SuggestTaskPriorityInputSchema},
  output: {schema: SuggestTaskPriorityOutputSchema},
  prompt: `You are an expert project management assistant.
Based on the provided task details, suggest an appropriate priority ('low', 'medium', or 'high') and provide a brief reasoning.

Consider the following factors:
- Keywords in the title or description (e.g., "urgent", "blocker", "critical", "important", "asap", "bug fix").
- The proximity of the due date (if provided). Tasks due very soon might warrant higher priority.
- The current priority (if it seems misaligned).

Task Title: {{{taskTitle}}}
{{#if taskDescription}}
Task Description: {{{taskDescription}}}
{{/if}}
Current Priority: {{{currentPriority}}}
{{#if dueDate}}
Due Date: {{{dueDate}}}
{{/if}}

Provide your suggestion in the specified JSON output format.
Reasoning should be concise, 1-2 sentences.
Ensure the suggestedPriority is one of 'low', 'medium', or 'high'.
`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: SuggestTaskPriorityInputSchema,
    outputSchema: SuggestTaskPriorityOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to provide priority suggestion.');
    }
    // Ensure the suggested priority is valid, defaulting to current if AI hallucinates.
    const validPriorities = TASK_PRIORITIES.map(p => p.value);
    if (!validPriorities.includes(output.suggestedPriority)) {
        output.suggestedPriority = input.currentPriority;
        output.reasoning = `AI provided an invalid priority. Keeping current: ${input.currentPriority}. Original AI reason: ${output.reasoning}`;
    }
    return output;
  }
);

