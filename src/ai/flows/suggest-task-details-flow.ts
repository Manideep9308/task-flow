
'use server';
/**
 * @fileOverview An AI flow to suggest task details (description, category, priority) based on a title.
 *
 * - suggestTaskDetails - A function that provides suggestions for task details.
 * - SuggestTaskDetailsInput - The input type for the suggestTaskDetails function.
 * - SuggestTaskDetailsOutput - The return type for the suggestTaskDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskPriority } from '@/lib/types';
import { DEFAULT_CATEGORIES, TASK_PRIORITIES } from '@/lib/constants';

const SuggestTaskDetailsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  currentDescription: z.string().optional().describe('Any existing description the user might have started typing.'),
});
export type SuggestTaskDetailsInput = z.infer<typeof SuggestTaskDetailsInputSchema>;

const SuggestTaskDetailsOutputSchema = z.object({
  suggestedDescription: z.string().describe('A detailed and helpful description for the task.'),
  suggestedCategory: z.string().describe('A relevant category for the task. Should ideally be one of the provided common categories, or a new sensible one if none fit well.'),
  suggestedPriority: z.custom<TaskPriority>((val) => TASK_PRIORITIES.map(p => p.value).includes(val as TaskPriority), {
    message: "Invalid priority. Must be 'low', 'medium', or 'high'.",
  }).describe("The suggested priority for the task ('low', 'medium', or 'high')."),
});
export type SuggestTaskDetailsOutput = z.infer<typeof SuggestTaskDetailsOutputSchema>;

export async function suggestTaskDetails(input: SuggestTaskDetailsInput): Promise<SuggestTaskDetailsOutput> {
  return suggestTaskDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskDetailsPrompt',
  input: {schema: SuggestTaskDetailsInputSchema},
  output: {schema: SuggestTaskDetailsOutputSchema},
  prompt: `You are a helpful assistant that suggests details for a new task.
Based on the provided task title and any current description, please suggest:
1.  A comprehensive and actionable description for the task.
2.  A suitable category for the task. Common categories include: ${DEFAULT_CATEGORIES.join(', ')}. If none of these fit well, suggest a new, concise category.
3.  A priority for the task (must be one of: 'low', 'medium', 'high').

Task Title: {{{title}}}
{{#if currentDescription}}
Current Description: {{{currentDescription}}}
{{/if}}

Provide your suggestions in the specified JSON output format.
For the priority, ensure it's one of 'low', 'medium', or 'high'.
For the category, if suggesting one not in the common list, make it a single, relevant word if possible.
For the description, expand on the title to make it clear what needs to be done.
`,
});

const suggestTaskDetailsFlow = ai.defineFlow(
  {
    name: 'suggestTaskDetailsFlow',
    inputSchema: SuggestTaskDetailsInputSchema,
    outputSchema: SuggestTaskDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to provide suggestions.');
    }
    // Ensure the suggested priority is valid, defaulting to medium if not.
    const validPriorities = TASK_PRIORITIES.map(p => p.value);
    if (!validPriorities.includes(output.suggestedPriority)) {
        output.suggestedPriority = 'medium';
    }
    return output;
  }
);
