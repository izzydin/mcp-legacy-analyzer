import * as t from '@babel/types';
import { getSafeLineNumber, getSafeColumnNumber } from '../utils/ast-helpers.js';
function processPropTypes(propTypesObject, componentPath, state) {
    const requiredProps = [];
    for (const prop of propTypesObject.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const propName = prop.key.name;
            let isRequired = false;
            let currentVal = prop.value;
            if (t.isMemberExpression(currentVal)) {
                if (t.isIdentifier(currentVal.property) && currentVal.property.name === 'isRequired') {
                    isRequired = true;
                }
            }
            if (isRequired) {
                requiredProps.push({
                    name: propName,
                    line: getSafeLineNumber(prop),
                    column: getSafeColumnNumber(prop)
                });
            }
        }
    }
    if (requiredProps.length === 0)
        return;
    const usedIdentifiers = new Set();
    componentPath.traverse({
        ClassProperty(p) {
            if (t.isIdentifier(p.node.key) && p.node.key.name === 'propTypes') {
                p.skip();
            }
        },
        Identifier(p) {
            usedIdentifiers.add(p.node.name);
        }
    });
    for (const reqProp of requiredProps) {
        if (!usedIdentifiers.has(reqProp.name)) {
            const result = {
                type: 'UNUSED_PROPTYPE',
                severity: 'low',
                line: reqProp.line,
                suggestion: `Remove the unused propType '${reqProp.name}' or implement its usage.`
            };
            state.report({
                ruleId: result.type,
                severity: 'suggestion',
                message: `Required prop '${reqProp.name}' is declared in propTypes but never accessed in the component.`,
                action: result.suggestion,
                line: result.line,
                column: reqProp.column
            });
        }
    }
}
/**
 * We map the new schema AnalysisResult fields to our internal engine's Diagnostic structure.
 * This ensures the results are pushed to the central analysis array (Context.diagnostics).
 */
export const AntiPatternVisitorRule = {
    id: 'anti-pattern-visitor',
    visitor: {
        JSXAttribute(path, state) {
            if (path.node.name.name === 'ref') {
                if (t.isStringLiteral(path.node.value)) {
                    const result = {
                        type: 'STRING_REF',
                        severity: 'high',
                        line: getSafeLineNumber(path.node),
                        suggestion: 'Use callback refs or React.createRef()/useRef() instead.'
                    };
                    state.report({
                        ruleId: result.type,
                        severity: 'error', // Mapping 'high' to engine's 'error'
                        message: 'String refs (e.g., ref="input") are deprecated and will be removed.',
                        action: result.suggestion,
                        line: result.line,
                        column: getSafeColumnNumber(path.node)
                    });
                }
            }
        },
        CallExpression(path, state) {
            const callee = path.node.callee;
            if (t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object) && callee.object.name === 'ReactDOM' &&
                t.isIdentifier(callee.property) && callee.property.name === 'findDOMNode') {
                const result = {
                    type: 'FIND_DOM_NODE',
                    severity: 'high',
                    line: getSafeLineNumber(path.node),
                    suggestion: 'Pass a ref directly to the DOM element instead.'
                };
                state.report({
                    ruleId: result.type,
                    severity: 'error',
                    message: 'ReactDOM.findDOMNode is deprecated in Strict Mode.',
                    action: result.suggestion,
                    line: result.line,
                    column: getSafeColumnNumber(path.node)
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
                            let returnedJSXPaths = [];
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
                                    hasKey = node.openingElement.attributes.some(attr => t.isJSXAttribute(attr) && attr.name.name === 'key');
                                }
                                if (!hasKey) {
                                    const result = {
                                        type: 'MISSING_KEY',
                                        severity: 'high',
                                        line: getSafeLineNumber(node),
                                        suggestion: 'Provide a unique "key" prop for elements in a list. Avoid array indices.'
                                    };
                                    state.report({
                                        ruleId: result.type,
                                        severity: 'error',
                                        message: 'Missing "key" prop for element returned from .map() inside JSX.',
                                        action: result.suggestion,
                                        line: result.line,
                                        column: getSafeColumnNumber(node)
                                    });
                                }
                            }
                        }
                    }
                }
            }
            // Check for fetch() calls
            const isFetch = (t.isIdentifier(callee) && callee.name === 'fetch') ||
                (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && callee.object.name === 'window' && t.isIdentifier(callee.property) && callee.property.name === 'fetch');
            if (isFetch) {
                let isHandled = false;
                let currentPath = path;
                // Check for .catch() in the promise chain
                while (currentPath.parentPath && currentPath.parentPath.isMemberExpression() &&
                    currentPath.parentPath.parentPath && currentPath.parentPath.parentPath.isCallExpression()) {
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
                    const result = {
                        type: 'UNHANDLED_FETCH',
                        severity: 'high',
                        line: getSafeLineNumber(path.node),
                        suggestion: 'Add a .catch() block or wrap the await fetch() in a try/catch block to handle network errors.'
                    };
                    state.report({
                        ruleId: result.type,
                        severity: 'error',
                        message: 'Unhandled fetch() call. Network requests can fail and should have error handling.',
                        action: result.suggestion,
                        line: result.line,
                        column: getSafeColumnNumber(path.node)
                    });
                }
            }
        },
        AssignmentExpression(path, state) {
            const left = path.node.left;
            const right = path.node.right;
            if (t.isMemberExpression(left) && t.isIdentifier(left.property) && left.property.name === 'propTypes' && t.isObjectExpression(right)) {
                if (t.isIdentifier(left.object)) {
                    const compName = left.object.name;
                    const binding = path.scope.getBinding(compName);
                    if (binding && binding.path) {
                        processPropTypes(right, binding.path, state);
                    }
                }
            }
        },
        ClassProperty(path, state) {
            if (t.isIdentifier(path.node.key) && path.node.key.name === 'propTypes' && path.node.static && path.node.value && t.isObjectExpression(path.node.value)) {
                const classPath = path.parentPath.parentPath;
                if (classPath && (classPath.isClassDeclaration() || classPath.isClassExpression())) {
                    processPropTypes(path.node.value, classPath, state);
                }
            }
        }
    }
};
