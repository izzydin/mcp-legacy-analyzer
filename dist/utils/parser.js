import { parse } from '@babel/parser';
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
export function parseSourceCode(code) {
    return parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
            'jsx',
            'typescript',
        ],
    });
}
