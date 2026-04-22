import { AnalysisRule, Context } from '../engine.js';
import * as t from '@babel/types';
import { getSafeLineNumber, getSafeColumnNumber } from '../../utils/ast-helpers.js';

export const GhostHunterRule: AnalysisRule = {
  id: 'ghost-hunter',
  visitor: {
    ClassMethod(path, state: Context) {
      if (t.isIdentifier(path.node.key)) {
        const methodName = path.node.key.name;
        const isDeprecated = [
          'componentWillMount', 'UNSAFE_componentWillMount',
          'componentWillReceiveProps', 'UNSAFE_componentWillReceiveProps',
          'componentWillUpdate', 'UNSAFE_componentWillUpdate'
        ].includes(methodName);

        if (isDeprecated) {
          state.report({
            ruleId: 'ghost-hunter',
            message: `The lifecycle method '${methodName}' is deprecated and unsafe for React 18 Concurrent Mode. It can lead to bugs with async rendering.`,
            action: `Deprecated Lifecycle: Refactor "${methodName}" to "useEffect" or "constructor". Avoid "UNSAFE_" prefixes as they are a temporary patch, not a long-term fix for React 18+.`,
            severity: 'warning',
            line: getSafeLineNumber(path.node),
            column: getSafeColumnNumber(path.node)
          });
        }
      }
    }
  }
};
