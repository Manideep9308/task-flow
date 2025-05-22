
'use server';
/**
 * @fileOverview An AI flow to suggest chat replies based on recent messages.
 *
 * - suggestChatReplies - A function that provides a list of suggested replies.
 * - SuggestChatRepliesInput - The input type for the suggestChatReplies function.
 * - SuggestChatRepliesOutput - The return type for the suggestChatReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ChatMessage, User } from '@/lib/types';

const ChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  timestamp: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  role: z.string().optional(),
});


const SuggestChatRepliesInputSchema = z.object({
  recentMessages: z.array(ChatMessageSchema).describe('The last few messages in the conversation, ordered oldest to newest.'),
  currentUser: UserSchema.describe('The user for whom replies are being suggested.'),
});
export type SuggestChatRepliesInput = z.infer<typeof SuggestChatRepliesInputSchema>;

const SuggestChatRepliesOutputSchema = z.object({
  suggestedReplies: z.array(z.string()).length(3).describe('An array of 3 short, contextually relevant reply suggestions.'),
});
export type SuggestChatRepliesOutput = z.infer<typeof SuggestChatRepliesOutputSchema>;

export async function suggestChatReplies(input: SuggestChatRepliesInput): Promise<SuggestChatRepliesOutput> {
  // Ensure there are messages to process
  if (!input.recentMessages || input.recentMessages.length === 0) {
    return { suggestedReplies: [] };
  }
  return suggestChatRepliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestChatRepliesPrompt',
  input: {schema: SuggestChatRepliesInputSchema},
  output: {schema: SuggestChatRepliesOutputSchema},
  prompt: `You are a helpful chat assistant. Your goal is to suggest 3 concise and relevant quick replies for the current user ({{{currentUser.name}}}) based on the recent conversation history.
The replies should be natural and typical for a chat conversation. Avoid overly complex sentences.

Recent Conversation History (most recent message is last):
{{#each recentMessages}}
- {{userName}}: {{{text}}}
{{/each}}

Suggest 3 replies that {{{currentUser.name}}} could send next:
`,
});

const suggestChatRepliesFlow = ai.defineFlow(
  {
    name: 'suggestChatRepliesFlow',
    inputSchema: SuggestChatRepliesInputSchema,
    outputSchema: SuggestChatRepliesOutputSchema,
  },
  async (input) => {
    if (!input.recentMessages || input.recentMessages.length === 0) {
      return { suggestedReplies: [] };
    }
    const {output} = await prompt(input);
    if (!output || !output.suggestedReplies) {
      return { suggestedReplies: [] }; // Return empty list if AI fails or output is malformed
    }
    // Ensure exactly 3 replies, or pad/truncate if necessary (though Zod schema should handle length)
    const replies = output.suggestedReplies.slice(0, 3);
    while (replies.length < 3 && replies.length > 0) { // Only pad if AI gave some replies
      replies.push("Got it."); // Simple fallback if AI gives less than 3
    }
    if (replies.length === 0 && input.recentMessages.length > 0) { // If AI gave nothing, but there were messages
        return { suggestedReplies: ["Okay", "Thanks!", "Interesting."]};
    }

    return { suggestedReplies: replies };
  }
);
