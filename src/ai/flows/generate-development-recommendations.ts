
// src/ai/flows/generate-development-recommendations.ts
'use server';

/**
 * @fileOverview Generates professional development recommendations for an employee based on their training records and performance review.
 *
 * - generateDevelopmentRecommendations - A function that generates personalized professional development recommendations.
 * - DevelopmentRecommendationsInput - The input type for the generateDevelopmentRecommendations function.
 * - DevelopmentRecommendationsOutput - The return type for the generateDevelopmentRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DevelopmentRecommendationsInputSchema = z.object({
  trainingRecords: z.string().describe("The employee's training records."),
  performanceReview: z.string().describe("The employee's performance review."),
});
export type DevelopmentRecommendationsInput = z.infer<typeof DevelopmentRecommendationsInputSchema>;

const DevelopmentRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Personalized professional development recommendations for the employee.'),
});
export type DevelopmentRecommendationsOutput = z.infer<typeof DevelopmentRecommendationsOutputSchema>;

export async function generateDevelopmentRecommendations(
  input: DevelopmentRecommendationsInput
): Promise<DevelopmentRecommendationsOutput> {
  return generateDevelopmentRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'developmentRecommendationsPrompt',
  input: {schema: DevelopmentRecommendationsInputSchema},
  output: {schema: DevelopmentRecommendationsOutputSchema},
  prompt: `You are an HR expert. Analyze the employee's training records and performance review, and generate personalized professional development recommendations.

Training Records: {{{trainingRecords}}}
Performance Review: {{{performanceReview}}}

Recommendations:`,
});

const generateDevelopmentRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateDevelopmentRecommendationsFlow',
    inputSchema: DevelopmentRecommendationsInputSchema,
    outputSchema: DevelopmentRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
