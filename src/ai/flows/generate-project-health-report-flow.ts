
'use server';
/**
 * @fileOverview An AI flow to generate a project health report based on current tasks.
 *
 * - generateProjectHealthReport - A function that analyzes tasks and produces a health report.
 * - GenerateProjectHealthReportInput - The input type for the function.
 * - GenerateProjectHealthReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TaskStatus, TaskPriority } from '@/lib/types';

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

const GenerateProjectHealthReportInputSchema = z.object({
  tasks: z.array(ProjectTaskSnapshotSchema).describe("A list of all current tasks for the project."),
  projectName: z.string().optional().describe("The name of the project."),
  reportDate: z.string().optional().describe("The date for which the report is being generated (YYYY-MM-DD)."),
});
export type GenerateProjectHealthReportInput = z.infer<typeof GenerateProjectHealthReportInputSchema>;

const GenerateProjectHealthReportOutputSchema = z.object({
  overallSummary: z.string().describe("A concise high-level summary of the project's current status."),
  riskAssessment: z.string().describe("An analysis of potential risks, including overdue tasks, tasks nearing deadlines, high-priority task pile-ups, or potential bottlenecks based on task distribution."),
  keyHighlights: z.string().describe("Notable achievements, recently completed critical tasks, or positive trends."),
  blockersAndChallenges: z.string().describe("Identified blockers, challenges, or areas where the project might be struggling."),
  actionableRecommendations: z.string().describe("Specific, actionable recommendations to improve project health, address risks, or tackle challenges."),
  reportDate: z.string().optional().describe("The report generation date."),
  projectName: z.string().optional().describe("The name of the project reported on."),
});
export type GenerateProjectHealthReportOutput = z.infer<typeof GenerateProjectHealthReportOutputSchema>;

export async function generateProjectHealthReport(input: GenerateProjectHealthReportInput): Promise<GenerateProjectHealthReportOutput> {
  // Add current date if not provided
  const reportInput = {
    ...input,
    reportDate: input.reportDate || new Date().toISOString().split('T')[0],
  };
  return generateProjectHealthReportFlow(reportInput);
}

const prompt = ai.definePrompt({
  name: 'generateProjectHealthReportPrompt',
  input: {schema: GenerateProjectHealthReportInputSchema},
  output: {schema: GenerateProjectHealthReportOutputSchema},
  prompt: `You are an expert project management analyst. Based on the following list of tasks, generate a comprehensive Project Health Report.

Project Name: {{{projectName}}}
Report Date: {{{reportDate}}}

Tasks:
{{#each tasks}}
- Task: "{{{title}}}" (ID: {{{id}}})
  Status: {{{status}}}
  Priority: {{{priority}}}
  {{#if dueDate}}Due: {{{dueDate}}}{{/if}}
  {{#if assignedTo}}Assigned To: User ID {{{assignedTo}}}{{/if}}
  {{#if category}}Category: {{{category}}}{{/if}}
  {{#if description}}Description: {{{description}}}{{/if}}
{{/each}}

Please structure your report with the following sections:
1.  **Overall Summary**: A brief, high-level overview of the project's current state.
2.  **Risk Assessment**: Analyze potential risks. Consider:
    *   Overdue tasks (current date is {{{reportDate}}}).
    *   Tasks with upcoming deadlines that are not 'inprogress' or 'done'.
    *   Concentration of high-priority tasks.
    *   Tasks marked 'todo' for a long time (if inferable, otherwise focus on current state).
    *   Potential bottlenecks (e.g., many tasks assigned to one person, though specific user names are not provided here, just IDs).
3.  **Key Highlights**: What are the recent positive developments or achievements? (e.g., critical tasks recently moved to 'done', good progress in a particular category).
4.  **Blockers & Challenges**: What are the main impediments or areas where the project seems to be facing difficulties? (e.g., tasks stuck in 'inprogress' for long, multiple high-priority items not started).
5.  **Actionable Recommendations**: Provide 2-3 specific, actionable suggestions to improve project health, address risks, or overcome challenges.

Be thorough and insightful. Use the provided task data to back up your analysis in each section.
The 'Assigned To' field contains user IDs; you can mention if many tasks point to the same ID as a potential concern without knowing the user's name.
`,
});

const generateProjectHealthReportFlow = ai.defineFlow(
  {
    name: 'generateProjectHealthReportFlow',
    inputSchema: GenerateProjectHealthReportInputSchema,
    outputSchema: GenerateProjectHealthReportOutputSchema,
  },
  async (input) => {
    if (!input.tasks || input.tasks.length === 0) {
      return {
        overallSummary: "No task data provided. Cannot generate a health report.",
        riskAssessment: "N/A",
        keyHighlights: "N/A",
        blockersAndChallenges: "N/A",
        actionableRecommendations: "N/A",
        reportDate: input.reportDate,
        projectName: input.projectName,
      };
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate project health report.');
    }
    // Ensure reportDate and projectName are part of the output if they were in the input
    return {
      ...output,
      reportDate: input.reportDate || output.reportDate,
      projectName: input.projectName || output.projectName,
    };
  }
);
