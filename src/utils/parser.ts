import { parse } from '@babel/parser';
import { File } from '@babel/types';

/**
 * Parses the provided source code into an Abstract Syntax Tree (AST) File node.
 * 
 * Supports both JSX and TypeScript syntax, allowing import/export
 * declarations everywhere for maximum compatibility with legacy codebases
 * that might have non-standard module structures.
 *
 * @param code - The source code string to parse.
 * @returns The parsed AST File node.
 */
export function parseSourceCode(code: string): File {
  return parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    plugins: [
      'jsx',
      'typescript',
    ],
  });
}
