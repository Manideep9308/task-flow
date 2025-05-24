
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
import type { TaskStatus, TaskPriority, User } from '@/lib/types'; // Assuming Task model is available
import { INITIAL_MOCK_USERS_LIST } from '@/contexts/auth-context'; // Import mock users

// Simplified Task Schema for the tool
const AssistantTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.custom<TaskStatus>(),
  priority: z.custom<TaskPriority>(),
  assignedTo: z.string().optional(), // User ID
  description: z.string().optional(),
  category: z.string().optional(),
  dueDate: z.string().optional(),
});
export type AssistantTask = z.infer<typeof AssistantTaskSchema>;


const AppAssistantInputSchema = z.object({
  userInput: z.string().describe('The query or message typed by the user.'),
  tasks: z.array(AssistantTaskSchema).describe('A list of all current tasks (id, title, status, priority, assignedTo, description, category, dueDate) available to the assistant for context and querying.'),
});
export type AppAssistantInput = z.infer<typeof AppAssistantInputSchema>;

const AppAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI assistant's response to the user's query."),
});
export type AppAssistantOutput = z.infer<typeof AppAssistantOutputSchema>;

// Tool definition
const getTasksByCriteriaTool = ai.defineTool(
  {
    name: 'getTasksByCriteria',
    description: 'Filters and retrieves tasks based on specified criteria like status, priority, assignee name, or keywords in title/description.',
    inputSchema: z.object({
      status: z.custom<TaskStatus>().optional().describe("Filter by task status (e.g., 'todo', 'inprogress', 'done')."),
      priority: z.custom<TaskPriority>().optional().describe("Filter by task priority (e.g., 'low', 'medium', 'high')."),
      assigneeName: z.string().optional().describe("Filter tasks assigned to a specific user by their name (e.g., 'Alice', 'Bob')."),
      keywords: z.string().optional().describe("Filter tasks where keywords match in title or description."),
    }),
    outputSchema: z.array(AssistantTaskSchema).describe("A list of tasks matching the criteria."),
  },
  async (input, context) => {
    // The 'context' object in a tool function can sometimes provide access to flow-level state or input.
    // However, for simplicity and directness here, we'll assume 'tasks' are available from the main flow input.
    // In a more complex scenario, you might pass 'tasks' through the context or have the tool fetch them.
    
    // This assumes `flowInput.tasks` is available. If Genkit context allows passing the main input, use it.
    // For this example, let's assume 'tasks' is passed via context or a higher scope.
    // This is a simplification. A real tool might need to query a DB or use context passed from the flow.
    const allTasks: AssistantTask[] = context?.flow?.input?.tasks || [];


    let filtered = allTasks;

    if (input.status) {
      filtered = filtered.filter(task => task.status === input.status);
    }
    if (input.priority) {
      filtered = filtered.filter(task => task.priority === input.priority);
    }
    if (input.assigneeName) {
      const assignee = INITIAL_MOCK_USERS_LIST.find(u => u.name?.toLowerCase() === input.assigneeName?.toLowerCase() || u.email.toLowerCase() === input.assigneeName?.toLowerCase());
      if (assignee) {
        filtered = filtered.filter(task => task.assignedTo === assignee.id);
      } else {
        // If assignee name doesn't match any known user, return empty or handle as "not found"
        return []; 
      }
    }
    if (input.keywords) {
      const lowerKeywords = input.keywords.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(lowerKeywords) ||
        (task.description && task.description.toLowerCase().includes(lowerKeywords))
      );
    }
    return filtered;
  }
);


export async function processUserQuery(input: AppAssistantInput): Promise<AppAssistantOutput> {
  return appAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appAssistantPrompt',
  input: {schema: AppAssistantInputSchema},
  output: {schema: AppAssistantOutputSchema},
  tools: [getTasksByCriteriaTool], // Make the tool available
  prompt: `You are a helpful AI assistant for a project management application called "IntelliTrack".
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
    - Time Travel Simulation (What-If Analyzer): Users can describe a 'what-if' scenario (e.g., task delays, reassignments) and the AI will predict the impact on the project timeline, risk level, and suggest solutions. This is on the 'Time Travel' page.
    - Idea Validator: Users can input their project ideas and get AI feedback on potential blind spots, risks, and challenging questions.
- Team Chat: A dedicated page for team members to message each other. Includes AI features for smart reply suggestions and generating chat highlights.
- Admin Panel: For users with 'admin' role, allows viewing users and (mock) changing their roles, (mock) application settings, and (mock) inviting team members.

User's Question: "{{{userInput}}}"

Based on the user's question and the provided task context (if any):
1. If the user asks "how to" do something related to IntelliTrack features (e.g., "how to create a task", "how do I change priority?", "how does the What-If Analyzer work?", "what are standup summaries?"), provide a concise, step-by-step explanation or describe the feature.
2. If the user asks about their tasks (e.g., "what are my high priority tasks?", "show tasks due today for Bob", "list tasks related to 'marketing'"), use the 'getTasksByCriteria' tool to find relevant tasks. Then, summarize the findings for the user. For example, "I found 3 tasks matching your criteria: Task A (High, Todo), Task B (Medium, In Progress)...". If no tasks are found, state that.
3. If the question is very general or unrelated to IntelliTrack, politely state that you are an assistant for IntelliTrack and can help with questions about the app or tasks.
4. Keep your responses friendly, concise, and actionable. If you use the tool, mention what you found or if nothing was found.

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
    // Pass the tasks from the input to the context for the tool
    const flowContext = { tasks: input.tasks };
    const {output} = await prompt(input, {context: flowContext });
    if (!output || !output.assistantResponse) {
      return { assistantResponse: "I'm sorry, I couldn't process your request at the moment. Please try again." };
    }
    return output;
  }
);
