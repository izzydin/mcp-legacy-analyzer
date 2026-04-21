import { z } from 'zod';

export const AnalyzeInputSchema = z.object({
  code: z.string(),
  filePath: z.string().optional(),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export const ComponentStructureInputSchema = z.object({
  code: z.string().optional(),
  filePath: z.string().optional(),
}).refine(data => data.code || data.filePath, {
  message: "Either 'code' or 'filePath' must be provided.",
});

export type ComponentStructureInput = z.infer<typeof ComponentStructureInputSchema>;
