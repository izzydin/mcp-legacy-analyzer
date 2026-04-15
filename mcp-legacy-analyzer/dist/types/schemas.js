import { z } from 'zod';
export const AnalyzeInputSchema = z.object({
    code: z.string(),
    filePath: z.string().optional(),
});
