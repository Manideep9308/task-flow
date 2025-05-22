
'use server';
/**
 * @fileOverview An AI flow to generate a daily standup summary from individual team member reports.
 *
 * - generateStandupSummary - A function that takes individual reports and creates a consolidated summary.
 * - GenerateStandupSummaryInput - The input type for the generateStandupSummary function.
 * - GenerateStandupSummaryOutput - The return type for the generateStandupSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { StandupReportItem } from '@/lib/types'; // Assuming this type is defined in lib/types

const StandupReportItemSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  didYesterday: z.string().describe("What the user accomplished yesterday."),
  doingToday: z.string().describe("What the user plans to do today."),
  blockers: z.string().optional().describe("Any blockers or issues the user is facing."),
});

const GenerateStandupSummaryInputSchema = z.object({
  reports: z.array(StandupReportItemSchema).describe("An array of individual standup reports from team members."),
  projectName: z.string().optional().describe("Optional name of the project for context."),
  summaryDate: z.string().optional().describe("Optional date for the summary, e.g., YYYY-MM-DD."),
});
export type GenerateStandupSummaryInput = z.infer<typeof GenerateStandupSummaryInputSchema>;

const GenerateStandupSummaryOutputSchema = z.object({
  consolidatedSummary: z.string().describe('A concise, structured summary of all team updates, organized by "Yesterday", "Today", and "Blockers".'),
});
export type GenerateStandupSummaryOutput = z.infer<typeof GenerateStandupSummaryOutputSchema>;

export async function generateStandupSummary(input: GenerateStandupSummaryInput): Promise<GenerateStandupSummaryOutput> {
  return generateStandupSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStandupSummaryPrompt',
  input: {schema: GenerateStandupSummaryInputSchema},
  output: {schema: GenerateStandupSummaryOutputSchema},
  prompt: `You are an expert project manager tasked with creating a daily standup summary.
{{#if projectName}}
Project: {{{projectName}}}
{{/if}}
{{#if summaryDate}}
Date: {{{summaryDate}}}
{{/if}}

Please synthesize the following individual team member reports into a single, clear, and structured daily standup summary.
The summary should have three main sections: "What was completed yesterday?", "What is planned for today?", and "Any blockers or issues?".
Combine related items where possible for conciseness. Attribute work to individuals.

Individual Reports:
{{#each reports}}
---
Team Member: {{{userName}}} ({{userId}})
Yesterday's Accomplishments: {{{didYesterday}}}
Today's Plans: {{{doingToday}}}
{{#if blockers}}
Blockers: {{{blockers}}}
{{else}}
Blockers: None reported
{{/if}}
---
{{/each}}

Generate the consolidated summary in a professional tone.
Focus on clear communication of progress, plans, and impediments.
Example format:
**Daily Standup Summary - [Date]**
Optional: **Project: [Project Name]**

**Yesterday:**
*   [User Name]: [Summary of yesterday's work]
*   ...

**Today:**
*   [User Name]: [Summary of today's plans]
*   ...

**Blockers:**
*   [User Name]: [Blocker, if any]
*   ... (or "None reported.")
`,
});

const generateStandupSummaryFlow = ai.defineFlow(
  {
    name: 'generateStandupSummaryFlow',
    inputSchema: GenerateStandupSummaryInputSchema,
    outputSchema: GenerateStandupSummaryOutputSchema,
  },
  async (input) => {
    if (!input.reports || input.reports.length === 0) {
      return { consolidatedSummary: "No team reports provided to generate a summary." };
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate standup summary.');
    }
    return output;
  }
);
