
'use server';
/**
 * @fileOverview An AI flow to suggest sub-tasks or a checklist for a given main task.
 *
 * - suggestSubtasks - A function that provides a list of suggested sub-tasks.
 * - SuggestSubtasksInput - The input type for the suggestSubtasks function.
 * - SuggestSubtasksOutput - The return type for the suggestSubtasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSubtasksInputSchema = z.object({
  taskTitle: z.string().describe('The title of the main task.'),
  taskDescription: z.string().optional().describe('The description of the main task.'),
});
export type SuggestSubtasksInput = z.infer<typeof SuggestSubtasksInputSchema>;

const SuggestSubtasksOutputSchema = z.object({
  suggestedSubtasks: z.array(z.string()).describe('A list of suggested sub-task titles or checklist items.'),
});
export type SuggestSubtasksOutput = z.infer<typeof SuggestSubtasksOutputSchema>;

export async function suggestSubtasks(input: SuggestSubtasksInput): Promise<SuggestSubtasksOutput> {
  return suggestSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubtasksPrompt',
  input: {schema: SuggestSubtasksInputSchema},
  output: {schema: SuggestSubtasksOutputSchema},
  prompt: `You are a helpful project planning assistant.
Based on the provided main task title and description, please suggest a list of actionable sub-tasks or a checklist to help complete this main task.
Each suggested sub-task or checklist item should be concise and clear.
Return the suggestions as a list of strings.

Main Task Title: {{{taskTitle}}}
{{#if taskDescription}}
Main Task Description: {{{taskDescription}}}
{{/if}}

Please generate a list of 3 to 7 sub-tasks.
`,
});

const suggestSubtasksFlow = ai.defineFlow(
  {
    name: 'suggestSubtasksFlow',
    inputSchema: SuggestSubtasksInputSchema,
    outputSchema: SuggestSubtasksOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.suggestedSubtasks) {
      return { suggestedSubtasks: [] }; // Return empty list if AI fails or output is malformed
    }
    return output;
  }
);
