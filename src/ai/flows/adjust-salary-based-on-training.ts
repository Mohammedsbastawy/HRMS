'use server';
/**
 * @fileOverview Adjust salary based on employee performance reviews and training outcomes using GenAI.
 *
 * - adjustSalaryBasedOnTraining - A function that handles the salary adjustment process.
 * - AdjustSalaryBasedOnTrainingInput - The input type for the adjustSalaryBasedOnTraining function.
 * - AdjustSalaryBasedOnTrainingOutput - The return type for the adjustSalaryBasedOnTraining function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustSalaryBasedOnTrainingInputSchema = z.object({
  employeeName: z.string().describe('The name of the employee.'),
  performanceReviewScore: z.number().describe('The performance review score of the employee.'),
  trainingCompletionStatus: z.string().describe('The completion status of the training. Possible values: Completed, In Progress, Not Started'),
  trainingOutcome: z.string().describe('The outcome of the training. Possible values: Exceeded Expectations, Met Expectations, Did Not Meet Expectations'),
  currentSalary: z.number().describe('The current salary of the employee.'),
});
export type AdjustSalaryBasedOnTrainingInput = z.infer<typeof AdjustSalaryBasedOnTrainingInputSchema>;

const AdjustSalaryBasedOnTrainingOutputSchema = z.object({
  recommendedSalaryAdjustment: z.string().describe('The recommended salary adjustment for the employee.'),
  professionalDevelopmentRecommendations: z.string().describe('Professional development recommendations for the employee.'),
});
export type AdjustSalaryBasedOnTrainingOutput = z.infer<typeof AdjustSalaryBasedOnTrainingOutputSchema>;

export async function adjustSalaryBasedOnTraining(input: AdjustSalaryBasedOnTrainingInput): Promise<AdjustSalaryBasedOnTrainingOutput> {
  return adjustSalaryBasedOnTrainingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustSalaryBasedOnTrainingPrompt',
  input: {schema: AdjustSalaryBasedOnTrainingInputSchema},
  output: {schema: AdjustSalaryBasedOnTrainingOutputSchema},
  prompt: `You are an HR expert specializing in compensation and professional development.

Based on the employee's performance review score, training completion status, training outcome, and current salary, you will recommend a salary adjustment and provide professional development recommendations.

Employee Name: {{{employeeName}}}
Performance Review Score: {{{performanceReviewScore}}}
Training Completion Status: {{{trainingCompletionStatus}}}
Training Outcome: {{{trainingOutcome}}}
Current Salary: {{{currentSalary}}}

Consider these factors when making your recommendations:

- High performance review scores and successful training outcomes should result in a higher salary adjustment.
- Unsuccessful training outcomes may result in a lower or no salary adjustment.
- The employee's current salary should be taken into account when determining the appropriate adjustment amount.

Respond with:

Recommended Salary Adjustment: [Recommended salary adjustment for the employee]
Professional Development Recommendations: [Professional development recommendations for the employee]`,
});

const adjustSalaryBasedOnTrainingFlow = ai.defineFlow(
  {
    name: 'adjustSalaryBasedOnTrainingFlow',
    inputSchema: AdjustSalaryBasedOnTrainingInputSchema,
    outputSchema: AdjustSalaryBasedOnTrainingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
