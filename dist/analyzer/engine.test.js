import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import { AnalysisEngine } from './engine.js';
describe('AnalysisEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new AnalysisEngine();
    });
    const parseCode = (code) => parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
    it('should extract components in Stage 1 and populate context', () => {
        const code = `
      import React from 'react';
      
      class MyComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
      
      const MyFunctionalComponent = () => <span />;
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.components).toHaveLength(2);
        expect(context.components[0].name).toBe('MyComponent');
        expect(context.components[1].name).toBe('MyFunctionalComponent');
    });
    it('should run merged rules in Stage 2 and populate diagnostics', () => {
        const code = `
      const x = 1;
      console.log(x);
      debugger;
    `;
        const noConsoleRule = {
            id: 'no-console',
            visitor: {
                CallExpression(path, state) {
                    const callee = path.node.callee;
                    if (callee.type === 'MemberExpression' &&
                        callee.object.type === 'Identifier' &&
                        callee.object.name === 'console') {
                        state.report({
                            ruleId: 'no-console',
                            message: 'Unexpected console statement',
                            severity: 'warning',
                            line: path.node.loc?.start.line ?? -1,
                            column: path.node.loc?.start.column ?? -1
                        });
                    }
                }
            }
        };
        const noDebuggerRule = {
            id: 'no-debugger',
            visitor: {
                DebuggerStatement(path, state) {
                    state.report({
                        ruleId: 'no-debugger',
                        message: 'Unexpected debugger statement',
                        severity: 'error',
                        line: path.node.loc?.start.line ?? -1,
                        column: path.node.loc?.start.column ?? -1
                    });
                }
            }
        };
        engine.registerRules([noConsoleRule, noDebuggerRule]);
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(2);
        const consoleDiag = context.diagnostics.find(d => d.ruleId === 'no-console');
        expect(consoleDiag).toBeDefined();
        expect(consoleDiag?.severity).toBe('warning');
        const debuggerDiag = context.diagnostics.find(d => d.ruleId === 'no-debugger');
        expect(debuggerDiag).toBeDefined();
        expect(debuggerDiag?.severity).toBe('error');
    });
});
