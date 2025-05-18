
'use server';
/**
 * @fileOverview An AI flow to generate a cover image for a task.
 *
 * - generateTaskImage - A function that generates an image based on task title/description.
 * - GenerateTaskImageInput - The input type for the generateTaskImage function.
 * - GenerateTaskImageOutput - The return type for the generateTaskImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskImageInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
  taskDescription: z.string().optional().describe('An optional description of the task for more context.'),
});
export type GenerateTaskImageInput = z.infer<typeof GenerateTaskImageInputSchema>;

const GenerateTaskImageOutputSchema = z.object({
  imageDataUri: z.string().optional().describe("The generated image as a base64 data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
  failureReason: z.string().optional().describe("Reason why image generation might have failed."),
});
export type GenerateTaskImageOutput = z.infer<typeof GenerateTaskImageOutputSchema>;

export async function generateTaskImage(input: GenerateTaskImageInput): Promise<GenerateTaskImageOutput> {
  return generateTaskImageFlow(input);
}

const generateTaskImageFlow = ai.defineFlow(
  {
    name: 'generateTaskImageFlow',
    inputSchema: GenerateTaskImageInputSchema,
    outputSchema: GenerateTaskImageOutputSchema,
  },
  async (input) => {
    try {
      const promptParts = [
        {text: `Generate a visually appealing cover image for a task. Focus on a single, clear subject related to the task title and description. The image should be suitable for a small thumbnail or card header. Make it vibrant and modern in a neon theme if possible.`},
        {text: `Task Title: ${input.taskTitle}`},
      ];
      if (input.taskDescription) {
        promptParts.push({text: `Task Description: ${input.taskDescription}`});
      }

      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: promptParts,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          // Optionally add safetySettings if needed
        },
      });

      if (media?.url) {
        return { imageDataUri: media.url };
      } else {
        // Check if there might be text output indicating an error from the model
        // This part depends on how Gemini 2.0 Flash Exp signals image generation failure in its response
        // For now, we assume if media.url is not present, it's a failure.
        return { failureReason: 'Image data was not returned by the AI model. The model might have refused to generate the image based on the prompt or encountered an issue.' };
      }
    } catch (error) {
      console.error("Error in generateTaskImageFlow:", error);
      let errorMessage = 'An unexpected error occurred during image generation.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // It's possible the error object from Genkit/GoogleAI has more specific details
      // For instance, error.cause or error.details
      // Add more detailed error logging if available
      return { failureReason: errorMessage };
    }
  }
);
