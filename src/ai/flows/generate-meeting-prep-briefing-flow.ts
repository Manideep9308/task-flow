
'use server';
/**
 * @fileOverview An AI flow to generate a meeting preparation briefing for a specific task.
 *
 * - generateMeetingPrepBriefing - A function that analyzes a task and its comments to create a briefing.
 * - MeetingPrepBriefingInput - The input type for the function.
 * - MeetingPrepBriefingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Task, Comment } from '@/lib/types';

// Define Zod schemas for Task and Comment if not already globally available for flows
// For simplicity, we'll define basic versions here.
// In a larger app, these might come from a shared schema definition.
const CommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  timestamp: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(), // Simplified, ideally use z.custom<TaskStatus>()
  priority: z.string(), // Simplified, ideally use z.custom<TaskPriority>()
  dueDate: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  comments: z.array(CommentSchema).optional(),
});


const MeetingPrepBriefingInputSchema = z.object({
  task: TaskSchema.describe("The task object for which the meeting briefing is required. This includes its title, description, status, priority, due date, assigned user, and any comments."),
});
export type MeetingPrepBriefingInput = z.infer<typeof MeetingPrepBriefingInputSchema>;

const MeetingPrepBriefingOutputSchema = z.object({
  taskTitle: z.string().describe("The title of the task."),
  taskOverview: z.string().describe("A concise AI-generated summary of the task's purpose, current status, and priority."),
  keyDiscussionPoints: z.array(z.string()).describe("A list of 2-4 key points or questions that should be discussed in a meeting about this task, derived from its description and comments."),
  identifiedBlockers: z.array(z.string()).describe("A list of any blockers explicitly mentioned or strongly implied in the task description or comments."),
  suggestedAgendaItems: z.array(z.string()).describe("A list of 2-3 suggested agenda items for a meeting focused on this task."),
});
export type MeetingPrepBriefingOutput = z.infer<typeof MeetingPrepBriefingOutputSchema>;


export async function generateMeetingPrepBriefing(input: MeetingPrepBriefingInput): Promise<MeetingPrepBriefingOutput> {
  return generateMeetingPrepBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingPrepBriefingPrompt',
  input: {schema: MeetingPrepBriefingInputSchema},
  output: {schema: MeetingPrepBriefingOutputSchema},
  prompt: `You are an expert meeting preparation assistant. Your goal is to generate a concise briefing for a meeting about the following task.
Analyze the task's details, including its title, description, status, priority, due date, assigned user, and especially its comments.

Task Details:
- Title: {{{task.title}}}
- Description: {{{task.description}}}
- Status: {{{task.status}}}
- Priority: {{{task.priority}}}
{{#if task.dueDate}}- Due Date: {{{task.dueDate}}}{{/if}}
{{#if task.assignedTo}}- Assigned To: {{{task.assignedTo}}}{{/if}}
{{#if task.category}}- Category: {{{task.category}}}{{/if}}

{{#if task.comments.length}}
Comments:
{{#each task.comments}}
- {{this.userName}} ({{this.timestamp}}): {{{this.text}}}
{{/each}}
{{else}}
No comments on this task.
{{/if}}

Based on all the information above, provide the following:
1.  **Task Overview**: A brief summary (1-2 sentences) of the task's main objective and its current state (status, priority).
2.  **Key Discussion Points**: Identify 2-4 critical points, questions, or unresolved issues from the task description or comments that need clarification or discussion in a meeting.
3.  **Identified Blockers**: List any clear blockers mentioned or strongly implied. If none, state "No explicit blockers identified."
4.  **Suggested Agenda Items**: Suggest 2-3 specific, actionable agenda items for a meeting focused on moving this task forward.

Format your response strictly according to the 'MeetingPrepBriefingOutput' schema. Ensure arrays are populated appropriately.
Focus on actionable insights from the provided text.
`,
});

const generateMeetingPrepBriefingFlow = ai.defineFlow(
  {
    name: 'generateMeetingPrepBriefingFlow',
    inputSchema: MeetingPrepBriefingInputSchema,
    outputSchema: MeetingPrepBriefingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate meeting prep briefing.');
    }
    // Ensure all array fields are initialized even if AI returns undefined for them
    return {
        taskTitle: output.taskTitle || input.task.title, // Fallback to input task title
        taskOverview: output.taskOverview || "Overview could not be generated.",
        keyDiscussionPoints: output.keyDiscussionPoints || [],
        identifiedBlockers: output.identifiedBlockers || [],
        suggestedAgendaItems: output.suggestedAgendaItems || [],
    };
  }
);
