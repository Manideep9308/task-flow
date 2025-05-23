
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

// Re-using ProjectTaskSnapshotSchema for the tasks array within the input
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
  projectName: z.string().optional().describe("The name of the project."),
  startDate: z.string().optional().describe("The start date of the project (YYYY-MM-DD)."),
  endDate: z.string().optional().describe("The end date of the project (YYYY-MM-DD)."),
  totalTasks: z.number().describe("Total number of tasks in the project."),
  tasksCompleted: z.number().describe("Number of tasks marked as completed."),
  tasksIncomplete: z.number().describe("Number of tasks not yet completed."),
  tasksDelayed: z.number().describe("Number of tasks that were delayed (e.g., completed past due date or still open past due date)."),
  tasksBlocked: z.number().describe("Number of tasks that were explicitly marked or identified as blocked."),
  topContributors: z.array(z.string()).describe("A list of names or IDs of top contributors to the project."),
  activityLogs: z.string().describe("A summary or log of key activities during the project."),
  issueSummary: z.string().describe("A summary of key issues encountered during the project."),
  timelineEvents: z.string().describe("A string describing key events or milestones in the project timeline."),
  tasks: z.array(ProjectTaskSnapshotSchema).describe("A list of all tasks considered part of the 'completed' project or phase, for detailed AI analysis."),
});
export type GenerateRetrospectiveReportInput = z.infer<typeof GenerateRetrospectiveReportInputSchema>;

const RetrospectiveReportOutputSchema = z.object({
  wentWell: z.string().describe("A summary of what went well during the project, as 2-3 bullet points."),
  challenges: z.string().describe("A summary of main pain points, delays, and blockers encountered."),
  learningsAndImprovements: z.string().describe("A list of 2-3 actionable process or communication improvements for future projects."),
  performanceMetricsSummary: z.string().describe("A summary of performance metrics like completion rate, average delay per task (if calculable), contributor performance insights, and sprint velocity (if applicable)."),
  overallProjectSentiment: z.string().optional().describe("A brief qualitative assessment of the overall project journey and outcome."),
  projectName: z.string().optional(),
  projectEndDate: z.string().optional(), // Corresponds to 'endDate' from input
});
export type RetrospectiveReportOutput = z.infer<typeof RetrospectiveReportOutputSchema>;

export async function generateRetrospectiveReport(input: GenerateRetrospectiveReportInput): Promise<RetrospectiveReportOutput> {
  // Ensure projectEndDate in output matches endDate from input if provided
  const reportInput = {
    ...input,
    endDate: input.endDate || input.tasks.length > 0 ? input.tasks.reduce((latest, task) => { // Fallback if endDate not given
        const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(0);
        return taskDate > latest ? taskDate : latest;
      }, new Date(0)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
  return generateRetrospectiveReportFlow(reportInput);
}

const prompt = ai.definePrompt({
  name: 'generateRetrospectiveReportPrompt',
  input: {schema: GenerateRetrospectiveReportInputSchema},
  output: {schema: RetrospectiveReportOutputSchema},
  prompt: `
You are an expert project analyst. Based on the following data, generate a structured project retrospective report.

### Project Info:
Project Name: {{#if projectName}}{{projectName}}{{else}}N/A{{/if}}
Start Date: {{#if startDate}}{{startDate}}{{else}}N/A{{/if}}
End Date: {{#if endDate}}{{endDate}}{{else}}N/A{{/if}}

### Task Summary:
Total Tasks: {{totalTasks}}
Completed: {{tasksCompleted}}
Incomplete: {{tasksIncomplete}}
Delayed Tasks: {{tasksDelayed}}
Blocked Tasks: {{tasksBlocked}}
Top Contributors: {{#if topContributors}}{{#each topContributors}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}N/A{{/if}}

### Activity Logs:
{{{activityLogs}}}

### Key Issues Reported:
{{{issueSummary}}}

### Project Timeline Overview:
{{{timelineEvents}}}

---
Analyze the detailed task list provided below to inform your report:
{{#each tasks}}
- Task: "{{{title}}}" (ID: {{{id}}})
  Status: {{{status}}}
  Priority: {{{priority}}}
  {{#if dueDate}}Due: {{{dueDate}}}{{/if}}
  {{#if assignedTo}}Assigned To: User ID {{{assignedTo}}}{{/if}}
  {{#if category}}Category: {{{category}}}{{/if}}
  {{#if description}}Description: {{{description}}}{{/if}}
{{/each}}
---

### Your Output Format:
**Project Retrospective Report – {{#if projectName}}{{projectName}}{{else}}N/A{{/if}}**

1.  🟢 **What Went Well**
    - (Summarize 2–3 key successes with bullet points based on the provided data, especially completed tasks and positive activity logs.)

2.  🔴 **What Didn’t Go Well**
    - (Summarize main pain points, delays, blockers based on the task summary stats like delayed/incomplete tasks, issue summary, and task details.)

3.  💡 **Improvement Suggestions**
    - (List 2–3 actionable process or communication improvements based on the challenges identified. Be specific.)

4.  📈 **Performance Metrics Summary**
    - (Analyze the provided Task Summary stats: Calculate completion rate (tasksCompleted / totalTasks). Comment on contributor performance based on 'topContributors' and task assignments if possible. Discuss task delays and blockages. If concepts like sprint velocity are mentioned in logs or events, incorporate them. Otherwise, focus on the provided metrics.)

Provide insights in a professional tone. Be concise, constructive, and unbiased. Avoid repetition. Use markdown-style formatting with bullet points where applicable.
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
        performanceMetricsSummary: "N/A. No task data to calculate metrics.",
        projectName: input.projectName,
        projectEndDate: input.endDate,
      };
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate retrospective report.');
    }
    return {
      ...output,
      projectName: input.projectName || output.projectName,
      projectEndDate: input.endDate || output.projectEndDate, // Ensure endDate is passed through
    };
  }
);
