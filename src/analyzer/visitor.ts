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

      // Check for .map() calls inside JSX
      if (t.isMemberExpression(callee) && t.isIdentifier(callee.property) && callee.property.name === 'map') {
        const inJSX = path.findParent(p => p.isJSXExpressionContainer());
        if (inJSX) {
          const argsPaths = path.get('arguments');
          if (Array.isArray(argsPaths) && argsPaths.length > 0) {
            const callbackPath = argsPaths[0];
            
            if (callbackPath.isArrowFunctionExpression() || callbackPath.isFunctionExpression()) {
              let returnedJSXPaths: any[] = [];
              
              if (callbackPath.isArrowFunctionExpression()) {
                const bodyPath = callbackPath.get('body');
                if (bodyPath.isJSXElement() || bodyPath.isJSXFragment()) {
                  returnedJSXPaths.push(bodyPath);
                }
              }
              
              if (returnedJSXPaths.length === 0) {
                callbackPath.traverse({
                  ReturnStatement(retPath) {
                    const argPath = retPath.get('argument');
                    if (argPath && (argPath.isJSXElement() || argPath.isJSXFragment())) {
                      returnedJSXPaths.push(argPath);
                    }
                  },
                  Function(funcPath) {
                    funcPath.skip();
                  }
                });
              }

              for (const jsxPath of returnedJSXPaths) {
                const node = jsxPath.node;
                let hasKey = false;
                
                if (t.isJSXElement(node)) {
                  hasKey = node.openingElement.attributes.some(attr => 
                    t.isJSXAttribute(attr) && attr.name.name === 'key'
                  );
                }
                
                if (!hasKey) {
                  const result: AnalysisResult = {
                    type: 'MISSING_KEY',
                    severity: 'high',
                    line: node.loc?.start.line ?? -1,
                    suggestion: 'Provide a unique "key" prop for elements in a list. Avoid array indices.'
                  };

                  state.report({
                    ruleId: result.type,
                    severity: 'error',
                    message: 'Missing "key" prop for element returned from .map() inside JSX.',
                    action: result.suggestion,
                    line: result.line,
                    column: node.loc?.start.column ?? -1
                  });
                }
              }
            }
          }
        }
      }
      // Check for fetch() calls
      const isFetch = 
        (t.isIdentifier(callee) && callee.name === 'fetch') ||
        (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && callee.object.name === 'window' && t.isIdentifier(callee.property) && callee.property.name === 'fetch');

      if (isFetch) {
        let isHandled = false;
        let currentPath: any = path;

        // Check for .catch() in the promise chain
        while (
          currentPath.parentPath && currentPath.parentPath.isMemberExpression() &&
          currentPath.parentPath.parentPath && currentPath.parentPath.parentPath.isCallExpression()
        ) {
          const memberExpr = currentPath.parentPath.node;
          if (t.isIdentifier(memberExpr.property) && memberExpr.property.name === 'catch') {
            isHandled = true;
            break;
          }
          currentPath = currentPath.parentPath.parentPath;
        }

        // Check if inside a try/catch block
        if (!isHandled) {
          const tryStatement = path.findParent(p => p.isTryStatement());
          if (tryStatement) {
            isHandled = true;
          }
        }

        if (!isHandled) {
          const result: AnalysisResult = {
            type: 'UNHANDLED_FETCH',
            severity: 'high',
            line: path.node.loc?.start.line ?? -1,
            suggestion: 'Add a .catch() block or wrap the await fetch() in a try/catch block to handle network errors.'
          };

          state.report({
            ruleId: result.type,
            severity: 'error',
            message: 'Unhandled fetch() call. Network requests can fail and should have error handling.',
            action: result.suggestion,
            line: result.line,
            column: path.node.loc?.start.column ?? -1
          });
        }
      }
    }
  }
};
