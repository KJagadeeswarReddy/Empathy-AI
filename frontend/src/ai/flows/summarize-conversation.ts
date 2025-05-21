// Summarize-conversation.ts
'use server';

/**
 * @fileOverview Summarizes the previous conversation between the user and the AI.
 *
 * - summarizePreviousConversation - A function that summarizes the conversation.
 * - SummarizePreviousConversationInput - The input type for the summarizePreviousConversation function.
 * - SummarizePreviousConversationOutput - The return type for the summarizePreviousConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePreviousConversationInputSchema = z.object({
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).describe('The previous conversation history between the user and the AI.'),
});

export type SummarizePreviousConversationInput = z.infer<typeof SummarizePreviousConversationInputSchema>;

const SummarizePreviousConversationOutputSchema = z.object({
  summary: z.string().describe('A summary of the previous conversation.'),
});

export type SummarizePreviousConversationOutput = z.infer<typeof SummarizePreviousConversationOutputSchema>;

export async function summarizePreviousConversation(input: SummarizePreviousConversationInput): Promise<SummarizePreviousConversationOutput> {
  return summarizePreviousConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePreviousConversationPrompt',
  input: {schema: SummarizePreviousConversationInputSchema},
  output: {schema: SummarizePreviousConversationOutputSchema},
  prompt: `You are an AI assistant that summarizes previous conversations between a user and an AI. The summary should be concise and capture the main topics discussed.

Previous Conversation:
{{#each conversationHistory}}
  {{role}}: {{content}}
{{/each}}

Summary:`, 
});

const summarizePreviousConversationFlow = ai.defineFlow(
  {
    name: 'summarizePreviousConversationFlow',
    inputSchema: SummarizePreviousConversationInputSchema,
    outputSchema: SummarizePreviousConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
