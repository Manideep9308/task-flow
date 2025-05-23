
'use server';
/**
 * @fileOverview An AI flow to validate a project premise or stress-test an idea.
 *
 * - validateProjectPremise - A function that analyzes a project idea and provides critical feedback.
 * - ValidateProjectPremiseInput - The input type for the function.
 * - ValidateProjectPremiseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ValidateProjectPremiseInput, ValidateProjectPremiseOutput, ValidationSection } from '@/lib/types';

const ValidationSectionSchema = z.object({
  title: z.string(),
  points: z.array(z.string()),
});

const ValidateProjectPremiseInputSchema = z.object({
  projectIdea: z.string().describe('A concise description of the project idea.'),
  coreProblemSolved: z.string().describe('The core problem this project aims to solve.'),
  targetAudience: z.string().describe('The primary target audience for this project.'),
  keyGoals: z.array(z.string()).describe('A list of key goals or objectives for the project.'),
});

const ValidateProjectPremiseOutputSchema = z.object({
  potentialBlindSpots: ValidationSectionSchema.describe('Potential unstated assumptions or areas the user might have overlooked.'),
  challengingQuestions: ValidationSectionSchema.describe('Critical questions the user/team should consider before proceeding.'),
  potentialRisks: ValidationSectionSchema.describe('High-level potential risks (market, user adoption, technical feasibility, etc.).'),
  alternativePerspectives: ValidationSectionSchema.describe('Different ways to approach the problem or solution.'),
});

export async function validateProjectPremise(input: ValidateProjectPremiseInput): Promise<ValidateProjectPremiseOutput> {
  return validateProjectPremiseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateProjectPremisePrompt',
  input: {schema: ValidateProjectPremiseInputSchema},
  output: {schema: ValidateProjectPremiseOutputSchema},
  prompt: `You are an experienced startup advisor and product strategist. Your role is to critically but constructively evaluate a new project idea.

Project Idea: "{{{projectIdea}}}"
This project aims to solve the following core problem: "{{{coreProblemSolved}}}"
The target audience is: "{{{targetAudience}}}"
Key goals for this project include:
{{#each keyGoals}}
- {{{this}}}
{{/each}}

Based on this information, please provide your analysis structured as follows:

1.  **Potential Blind Spots**: Identify potential unstated assumptions or areas the user might have overlooked. (Provide 2-4 bullet points).
2.  **Challenging Questions**: Formulate critical questions the team should answer before committing significant resources. (Provide 2-4 bullet points).
3.  **Potential Risks**: Highlight high-level potential risks (consider market, user adoption, technical feasibility, competition, etc.). (Provide 2-4 bullet points).
4.  **Alternative Perspectives**: Suggest different ways to frame the problem or alternative approaches to the solution. (Provide 1-3 bullet points).

Ensure each point is concise and actionable. The goal is to help the user think more deeply about their idea.
Return the output in the specified JSON format.
For each section, the 'title' field should be a descriptive heading (e.g., "Key Assumptions to Test", "Critical Questions for Your Team") and 'points' should be an array of strings for each bullet point.
`,
});

const validateProjectPremiseFlow = ai.defineFlow(
  {
    name: 'validateProjectPremiseFlow',
    inputSchema: ValidateProjectPremiseInputSchema,
    outputSchema: ValidateProjectPremiseOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate project premise validation.');
    }
    // Ensure titles are set if AI forgets them
    return {
        potentialBlindSpots: { title: output.potentialBlindSpots?.title || "Potential Blind Spots", points: output.potentialBlindSpots?.points || [] },
        challengingQuestions: { title: output.challengingQuestions?.title || "Challenging Questions", points: output.challengingQuestions?.points || [] },
        potentialRisks: { title: output.potentialRisks?.title || "Potential Risks", points: output.potentialRisks?.points || [] },
        alternativePerspectives: { title: output.alternativePerspectives?.title || "Alternative Perspectives", points: output.alternativePerspectives?.points || [] },
    };
  }
);
