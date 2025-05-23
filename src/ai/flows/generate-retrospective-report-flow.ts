
'use server';
/**
 * @fileOverview An AI flow to generate a project retrospective report.
 *
 * - generateRetrospectiveReport - Analyzes tasks from a conceptual "completed" project.
 * - GenerateRetrospectiveReportInput - Input type for the function.
 * - RetrospectiveReportOutput - Return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskStatus, TaskPriority } from '@/lib/types';

// Re-using ProjectTaskSnapshotSchema from project health report for input consistency
const ProjectTaskSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.custom<TaskStatus>(),
  priority: z.custom<TaskPriority>(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
});

const GenerateRetrospectiveReportInputSchema = z.object({
  tasks: z.array(ProjectTaskSnapshotSchema).describe("A list of all tasks considered part of the 'completed' project or phase."),
  projectName: z.string().optional().describe("The name of the project for which the retrospective is being generated."),
  projectEndDate: z.string().optional().describe("The conceptual end date of the project (YYYY-MM-DD). Helps in analyzing timeliness."),
});
export type GenerateRetrospectiveReportInput = z.infer<typeof GenerateRetrospectiveReportInputSchema>;

const RetrospectiveReportOutputSchema = z.object({
  wentWell: z.string().describe("A summary of what went well during the project. Focus on successes, timely completions (consider due dates vs. 'done' status for tasks), positive trends, and effective collaboration if inferable."),
  challenges: z.string().describe("A summary of what didn't go well or challenges faced. Identify overdue tasks (compare due dates with projectEndDate and 'done' status), recurring blockers (if patterns exist in descriptions/titles), scope creep, or areas of struggle."),
  learningsAndImprovements: z.string().describe("Actionable suggestions for improvements in future projects. These should be based on the 'went well' and 'challenges' sections. Focus on process changes, tool adoption, communication strategies, etc."),
  overallProjectSentiment: z.string().optional().describe("A brief qualitative assessment of the overall project journey and outcome, if inferable from the task data (e.g., 'Successfully completed despite initial delays', 'Challenging but delivered key objectives', 'Struggled with scope and deadlines')."),
  projectName: z.string().optional(),
  projectEndDate: z.string().optional(),
});
export type RetrospectiveReportOutput = z.infer<typeof RetrospectiveReportOutputSchema>;

export async function generateRetrospectiveReport(input: GenerateRetrospectiveReportInput): Promise<RetrospectiveReportOutput> {
  const reportInput = {
    ...input,
    projectEndDate: input.projectEndDate || new Date().toISOString().split('T')[0], // Default to today if not provided
  };
  return generateRetrospectiveReportFlow(reportInput);
}

const prompt = ai.definePrompt({
  name: 'generateRetrospectiveReportPrompt',
  input: {schema: GenerateRetrospectiveReportInputSchema},
  output: {schema: RetrospectiveReportOutputSchema},
  prompt: `You are an expert project analyst conducting a post-project retrospective.
Assume the provided list of tasks represents a project or project phase that has now concluded as of {{{projectEndDate}}}.
Project Name: {{{projectName}}}

Analyze the following tasks:
{{#each tasks}}
- Task: "{{{title}}}" (ID: {{{id}}})
  Status: {{{status}}}
  Priority: {{{priority}}}
  {{#if dueDate}}Due: {{{dueDate}}}{{/if}}
  {{#if assignedTo}}Assigned To: User ID {{{assignedTo}}}{{/if}}
  {{#if category}}Category: {{{category}}}{{/if}}
  {{#if description}}Description: {{{description}}}{{/if}}
{{/each}}

Based on this task data, please generate a retrospective report with the following sections:

1.  **What Went Well**:
    *   Identify successes. Were critical tasks completed? Were tasks marked 'done' generally on time (compare dueDate with projectEndDate, considering a task 'done' means it was completed by projectEndDate)?
    *   Highlight any positive trends or patterns inferable from task titles, descriptions, or categories (e.g., 'Successful launch of X', 'Efficient collaboration on Y').
    *   Mention aspects that likely contributed to success (e.g., clear task descriptions, high completion rate of high-priority tasks).

2.  **Challenges / What Didn't Go Well**:
    *   Identify tasks that were problematic. Were there many overdue tasks (status not 'done' by their dueDate, or dueDate past projectEndDate)?
    *   Point out recurring issues if visible in descriptions or titles (e.g., "repeated delays in component Z", "blocker mentioned in several tasks").
    *   Were there significant priority shifts or tasks stuck in 'inprogress' for long periods relative to their due dates?

3.  **Learnings and Improvement Suggestions**:
    *   Based on the 'What Went Well' and 'Challenges' sections, provide 2-4 actionable suggestions for future projects.
    *   These could relate to planning, execution, communication, resource allocation (if inferable), or risk management. Be specific. For example, "Implement clearer dependency tracking for critical path tasks" or "Hold weekly brief check-ins for high-risk phases."

4.  **Overall Project Sentiment (Optional)**:
    *   Provide a brief, qualitative summary of the project's journey if you can infer one from the data (e.g., 'Smooth execution with all targets met', 'Successfully navigated several obstacles to deliver key results', 'Faced significant challenges impacting timelines and scope').

Ensure your analysis is grounded in the provided task data. Use the projectEndDate of {{{projectEndDate}}} as the reference for "completion."
`,
});

const generateRetrospectiveReportFlow = ai.defineFlow(
  {
    name: 'generateRetrospectiveReportFlow',
    inputSchema: GenerateRetrospectiveReportInputSchema,
    outputSchema: RetrospectiveReportOutputSchema,
  },
  async (input) => {
    if (!input.tasks || input.tasks.length === 0) {
      return {
        wentWell: "No task data provided. Cannot generate a retrospective report.",
        challenges: "N/A",
        learningsAndImprovements: "N/A",
        projectName: input.projectName,
        projectEndDate: input.projectEndDate,
      };
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate retrospective report.');
    }
    return {
      ...output,
      projectName: input.projectName || output.projectName,
      projectEndDate: input.projectEndDate || output.projectEndDate,
    };
  }
);
