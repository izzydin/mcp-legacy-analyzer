import { z } from 'zod';

export const AnalyzeInputSchema = z.object({
  code: z.string().optional(),
  filePath: z.string().optional(),
}).refine(data => data.code || data.filePath, {
  message: "Either 'code' or 'filePath' must be provided."
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export const ComponentStructureInputSchema = z.object({
  code: z.string().optional(),
  filePath: z.string().optional(),
}).refine(data => data.code || data.filePath, {
  message: "Either 'code' or 'filePath' must be provided.",
});

export type ComponentStructureInput = z.infer<typeof ComponentStructureInputSchema>;

export type AntiPatternType = 
  | 'STRING_REF' 
  | 'FIND_DOM_NODE' 
  | 'MISSING_KEY' 
  | 'UNHANDLED_FETCH' 
  | 'UNUSED_PROPTYPE';

export interface AnalysisResult {
  type: AntiPatternType;
  severity: 'low' | 'medium' | 'high';
  line: number;
  suggestion: string;
}
