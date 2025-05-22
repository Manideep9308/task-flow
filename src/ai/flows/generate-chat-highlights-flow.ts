
'use server';
/**
 * @fileOverview An AI flow to generate highlights or a summary from a chat conversation.
 *
 * - generateChatHighlights - A function that provides a summary of chat messages.
 * - GenerateChatHighlightsInput - The input type for the generateChatHighlights function.
 * - GenerateChatHighlightsOutput - The return type for the generateChatHighlights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ChatMessage } from '@/lib/types';

const ChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  timestamp: z.string(),
});

const GenerateChatHighlightsInputSchema = z.object({
  messages: z.array(ChatMessageSchema).describe('All messages from the chat conversation, ordered oldest to newest.'),
});
export type GenerateChatHighlightsInput = z.infer<typeof GenerateChatHighlightsInputSchema>;

const GenerateChatHighlightsOutputSchema = z.object({
  highlights: z.string().describe('A concise, bulleted list or short summary of key discussion points, decisions, or important takeaways from the conversation.'),
});
export type GenerateChatHighlightsOutput = z.infer<typeof GenerateChatHighlightsOutputSchema>;

export async function generateChatHighlights(input: GenerateChatHighlightsInput): Promise<GenerateChatHighlightsOutput> {
  if (!input.messages || input.messages.length === 0) {
    return { highlights: "No messages to summarize." };
  }
  return generateChatHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatHighlightsPrompt',
  input: {schema: GenerateChatHighlightsInputSchema},
  output: {schema: GenerateChatHighlightsOutputSchema},
  prompt: `You are an expert summarizer. Analyze the following chat conversation and extract key discussion points, decisions made, or important takeaways.
Present these as a concise, bulleted list or a short summary.

Chat Conversation (oldest to newest):
{{#each messages}}
- {{userName}} ({{timestamp}}): {{{text}}}
{{/each}}

Provide the highlights:
`,
});

const generateChatHighlightsFlow = ai.defineFlow(
  {
    name: 'generateChatHighlightsFlow',
    inputSchema: GenerateChatHighlightsInputSchema,
    outputSchema: GenerateChatHighlightsOutputSchema,
  },
  async (input) => {
    if (!input.messages || input.messages.length === 0) {
      return { highlights: "No messages available to generate highlights." };
    }
    const {output} = await prompt(input);
    if (!output || !output.highlights) {
      return { highlights: "Could not generate highlights from the conversation." };
    }
    return output;
  }
);
