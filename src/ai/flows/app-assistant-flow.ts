
'use server';
/**
 * @fileOverview An AI flow for the in-app assistant chatbot.
 *
 * - processUserQuery - A function that takes user input and task context, and returns an AI response.
 * - AppAssistantInput - The input type for the processUserQuery function.
 * - AppAssistantOutput - The return type for the processUserQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AppAssistantInputSchema = z.object({
  userInput: z.string().describe('The query or message typed by the user.'),
  taskContext: z.string().optional().describe('A summarized string of current tasks (e.g., titles and statuses) to provide context to the AI. This can be empty if no tasks are available or relevant.'),
});
export type AppAssistantInput = z.infer<typeof AppAssistantInputSchema>;

const AppAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI assistant's response to the user's query."),
});
export type AppAssistantOutput = z.infer<typeof AppAssistantOutputSchema>;

export async function processUserQuery(input: AppAssistantInput): Promise<AppAssistantOutput> {
  return appAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appAssistantPrompt',
  input: {schema: AppAssistantInputSchema},
  output: {schema: AppAssistantOutputSchema},
  prompt: `You are a helpful AI assistant for a project management application called "TaskFlow".
Your goal is to answer user questions about the app or their tasks.

Application Features:
- Users can create tasks with titles, descriptions, priorities (low, medium, high), statuses (todo, inprogress, done), due dates, and categories.
- Tasks can be assigned to users.
- Tasks are displayed on a Kanban dashboard, a list view, and a calendar.
- The app has AI features like task detail suggestions, sub-task suggestions, and project health reports.

User's Question: "{{{userInput}}}"

{{#if taskContext}}
Current Task Context (titles and statuses, comma-separated):
{{{taskContext}}}
{{/if}}

Based on the user's question and the provided task context (if any):
1. If the user asks "how to" do something related to TaskFlow features (e.g., "how to create a task", "how do I change priority?"), provide a concise, step-by-step explanation.
2. If the user asks about their tasks (e.g., "what are my high priority tasks?", "show tasks due today"), try to answer based on the provided Task Context. If the context is insufficient, you can say "I can see your tasks are: [list from context]. For more specific filtering, please use the filter options on the Task List page." or ask clarifying questions.
3. If the question is very general or unrelated to TaskFlow, politely state that you are an assistant for TaskFlow and can help with questions about the app or tasks.
4. Keep your responses friendly, concise, and actionable.

Assistant's Response:
`,
});

const appAssistantFlow = ai.defineFlow(
  {
    name: 'appAssistantFlow',
    inputSchema: AppAssistantInputSchema,
    outputSchema: AppAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.assistantResponse) {
      return { assistantResponse: "I'm sorry, I couldn't process your request at the moment. Please try again." };
    }
    return output;
  }
);
