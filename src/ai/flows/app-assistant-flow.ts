
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
- Tasks are displayed on a Kanban dashboard (Dashboard page), a list view (Task List page), and a Calendar page.
- AI features include:
    - Task Detail Suggestions: AI can suggest descriptions, categories, and priorities when creating/editing tasks.
    - Sub-task Suggestions: AI can break down a main task into smaller sub-tasks or a checklist.
    - Task Priority Suggestions: AI can recommend a priority for a task based on its details.
    - Task Summaries: AI can generate overall summaries of all tasks or summaries based on specific keywords (Summary page).
    - Project Health Reports: AI can analyze current tasks to produce a detailed project health report (Reports page).
    - Standup Summaries: The app can generate AI-powered daily standup summaries (mock data for now). Past summaries can be viewed on the 'Standups' page. Users can generate a mock summary for the current day.
    - Time Travel Simulation: Users can describe a 'what-if' scenario (e.g., task delays, reassignments) and the AI will predict the impact on the project timeline, risk level, and suggest solutions. This is on the 'Time Travel' page.
- Team Chat: A dedicated page for team members to message each other. Includes AI features for smart reply suggestions and generating chat highlights.
- Admin Panel: For users with 'admin' role, allows viewing users and (mock) changing their roles, and (mock) application settings.

User's Question: "{{{userInput}}}"

{{#if taskContext}}
Current Task Context (titles and statuses, comma-separated):
{{{taskContext}}}
{{/if}}

Based on the user's question and the provided task context (if any):
1. If the user asks "how to" do something related to TaskFlow features (e.g., "how to create a task", "how do I change priority?", "how does time travel work?", "what are standup summaries?"), provide a concise, step-by-step explanation or describe the feature.
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

    