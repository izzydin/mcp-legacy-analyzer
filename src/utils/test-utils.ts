import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'vitest';
import { AnalysisEngine, AnalysisRule } from '../analyzer/engine.js';
import { parseSourceCode } from './parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads a fixture code sample from the __fixtures__ directory synchronously.
 * 
 * @param filename - The name of the file in the __fixtures__ directory
 * @returns The string content of the source code
 */
export function loadFixture(filename: string): string {
  const fixturePath = path.resolve(__dirname, '..', '__tests__', '__fixtures__', filename);
  return fs.readFileSync(fixturePath, 'utf-8');
}

/**
 * Verifies that an isolated rule correctly outputs the expected suggestion action
 */
export function verifyRuleSuggestion(rule: AnalysisRule, code: string, expectedSuggestion: string) {
  const engine = new AnalysisEngine();
  engine.registerRules([rule]); // TOTAL ISOLATION
  const ast = parseSourceCode(code);
  const context = engine.execute(ast);
  
  // Enforce exactly 1 diagnostic to prevent false positives
  expect(context.diagnostics).toHaveLength(1); 
  
  // Strict assertion on the technical accuracy of the React 18+ replacement
  expect(context.diagnostics[0].action).toBe(expectedSuggestion);
}
