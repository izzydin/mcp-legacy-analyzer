import { z } from 'zod';

export const AnalyzeInputSchema = z.object({
  code: z.string(),
  filePath: z.string().optional(),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;
