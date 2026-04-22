import { AnalysisRule, Context } from '../engine.js';
import * as t from '@babel/types';
import { getSafeLineNumber, getSafeColumnNumber } from '../../utils/ast-helpers.js';

export const ConcurrentScoutRule: AnalysisRule = {
  id: 'concurrent-scout',
  visitor: {
    VariableDeclarator(path, state: Context) {
      const init = path.node.init;
      if (!init || !t.isCallExpression(init)) return;

      const isUseState = 
        (t.isIdentifier(init.callee) && init.callee.name === 'useState') ||
        (t.isMemberExpression(init.callee) && 
         t.isIdentifier(init.callee.property) && 
         init.callee.property.name === 'useState');
      
      if (!isUseState || !t.isArrayPattern(path.node.id)) return;

      const elements = path.node.id.elements;
      if (elements.length < 2 || !t.isIdentifier(elements[0]) || !t.isIdentifier(elements[1])) return;

      const stateName = elements[0].name;
      const setterName = elements[1].name;

      let passedToHeavyComponent = false;
      let heavyComponentLine = -1;
      let heavyComponentCol = -1;
      let heavyComponentName = '';
      
      let setterInComplexFunction = false;

      const scope = path.scope;
      
      // 1. Check state usage: Is it passed to a heavy component?
      const stateBinding = scope.getBinding(stateName);
      if (stateBinding) {
        for (const refPath of stateBinding.referencePaths) {
          // Check if refPath is used as a JSX Attribute value
          const jsxAttr = refPath.findParent(p => p.isJSXAttribute());
          if (jsxAttr) {
            const jsxElement = jsxAttr.findParent(p => p.isJSXOpeningElement());
            if (jsxElement && t.isJSXOpeningElement(jsxElement.node) && t.isJSXIdentifier(jsxElement.node.name)) {
              const compName = jsxElement.node.name.name;
              if (/(List|Grid|Table)/i.test(compName)) {
                passedToHeavyComponent = true;
                heavyComponentName = compName;
                heavyComponentLine = getSafeLineNumber(refPath.node);
                heavyComponentCol = getSafeColumnNumber(refPath.node);
                break;
              }
            }
          }
        }
      }

      // 2. Check setter usage: Is it called in a complex function?
      const setterBinding = scope.getBinding(setterName);
      if (setterBinding) {
        for (const refPath of setterBinding.referencePaths) {
          if (refPath.parentPath?.isCallExpression() && refPath.parentPath.node.callee === refPath.node) {
            const enclosingFunc = refPath.getFunctionParent();
            // Ensure the function is not the component itself
            if (enclosingFunc && enclosingFunc !== scope.path) {
              let hasComplexOps = false;
              
              // Traverse the enclosing function to detect loops or complex array methods
              enclosingFunc.traverse({
                CallExpression(callPath) {
                  const callee = callPath.node.callee;
                  if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                    if (['map', 'filter', 'reduce', 'sort', 'forEach'].includes(callee.property.name)) {
                      hasComplexOps = true;
                      callPath.stop();
                    }
                  }
                },
                ForStatement(p) { hasComplexOps = true; p.stop(); },
                ForOfStatement(p) { hasComplexOps = true; p.stop(); },
                ForInStatement(p) { hasComplexOps = true; p.stop(); },
                WhileStatement(p) { hasComplexOps = true; p.stop(); },
              });

              if (hasComplexOps) {
                setterInComplexFunction = true;
                break;
              }
            }
          }
        }
      }

      // 3. Report if both conditions are met
      if (passedToHeavyComponent && setterInComplexFunction) {
        state.report({
          ruleId: 'concurrent-scout',
          severity: 'suggestion',
          message: "Performance: State '" + stateName + "' is updated via complex transformations and passed to a heavy component <" + heavyComponentName + ">.",
          action: `React 18+: Heavy state updates in "${setterName}" can block the UI. Wrap in "startTransition" or use "useDeferredValue(${stateName})" to keep the interface responsive during concurrent rendering.`,
          line: heavyComponentLine,
          column: heavyComponentCol
        });
      }
    }
  }
};
