import { AnalysisRule, Context } from './engine.js';
import * as t from '@babel/types';
import { AnalysisResult } from '../types/schemas.js';

/**
 * We map the new schema AnalysisResult fields to our internal engine's Diagnostic structure.
 * This ensures the results are pushed to the central analysis array (Context.diagnostics).
 */
export const AntiPatternVisitorRule: AnalysisRule = {
  id: 'anti-pattern-visitor',
  visitor: {
    JSXAttribute(path, state: Context) {
      if (path.node.name.name === 'ref') {
        if (t.isStringLiteral(path.node.value)) {
          
          const result: AnalysisResult = {
            type: 'STRING_REF',
            severity: 'high',
            line: path.node.loc?.start.line ?? -1,
            suggestion: 'Use callback refs or React.createRef()/useRef() instead.'
          };

          state.report({
            ruleId: result.type,
            severity: 'error', // Mapping 'high' to engine's 'error'
            message: 'String refs (e.g., ref="input") are deprecated and will be removed.',
            action: result.suggestion,
            line: result.line,
            column: path.node.loc?.start.column ?? -1
          });
        }
      }
    },
    CallExpression(path, state: Context) {
      const callee = path.node.callee;
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) && callee.object.name === 'ReactDOM' &&
        t.isIdentifier(callee.property) && callee.property.name === 'findDOMNode'
      ) {
        
        const result: AnalysisResult = {
          type: 'FIND_DOM_NODE',
          severity: 'high',
          line: path.node.loc?.start.line ?? -1,
          suggestion: 'Pass a ref directly to the DOM element instead.'
        };

        state.report({
          ruleId: result.type,
          severity: 'error',
          message: 'ReactDOM.findDOMNode is deprecated in Strict Mode.',
          action: result.suggestion,
          line: result.line,
          column: path.node.loc?.start.column ?? -1
        });
      }
    }
  }
};
