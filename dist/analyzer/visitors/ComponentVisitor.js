import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { getSafeLineNumber, getSafeEndLineNumber } from '../../utils/ast-helpers.js';
export class ComponentVisitor {
    /**
     * Traverses the AST carefully, isolating component states to prevent state leakage
     * between different file analyses or multiple invocations.
     *
     * @param ast - The parsed Babel File node
     * @returns An array of component metadata found in the AST
     */
    static extractComponents(ast) {
        const components = [];
        // Handle Babel's ESM interop for the traverse function
        const traverseFn = typeof traverse === 'function' ? traverse : traverse.default;
        const visitor = {
            ClassDeclaration(path) {
                if (ComponentVisitor.isClassComponent(path.node)) {
                    const name = path.node.id?.name || 'AnonymousClass';
                    components.push(ComponentVisitor.createMetadata(name, 'Class', path.node));
                }
            },
            ClassExpression(path) {
                if (ComponentVisitor.isClassComponent(path.node)) {
                    let name = path.node.id?.name;
                    if (!name && path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
                        name = path.parentPath.node.id.name;
                    }
                    components.push(ComponentVisitor.createMetadata(name || 'AnonymousClass', 'Class', path.node));
                }
            },
            FunctionDeclaration(path) {
                if (ComponentVisitor.returnsJSX(path)) {
                    const name = path.node.id?.name || 'AnonymousFunction';
                    components.push(ComponentVisitor.createMetadata(name, 'Functional', path.node));
                }
            },
            FunctionExpression(path) {
                if (ComponentVisitor.returnsJSX(path)) {
                    let name = path.node.id?.name;
                    if (!name && path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
                        name = path.parentPath.node.id.name;
                    }
                    components.push(ComponentVisitor.createMetadata(name || 'AnonymousFunction', 'Functional', path.node));
                }
            },
            ArrowFunctionExpression(path) {
                if (ComponentVisitor.returnsJSX(path)) {
                    let name = 'AnonymousArrowFunction';
                    if (path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
                        name = path.parentPath.node.id.name;
                    }
                    else if (path.parentPath.isAssignmentExpression() && t.isIdentifier(path.parentPath.node.left)) {
                        name = path.parentPath.node.left.name;
                    }
                    else if (path.parentPath.isAssignmentExpression() &&
                        t.isMemberExpression(path.parentPath.node.left) &&
                        t.isIdentifier(path.parentPath.node.left.property)) {
                        name = path.parentPath.node.left.property.name;
                    }
                    components.push(ComponentVisitor.createMetadata(name, 'Functional', path.node));
                }
            }
        };
        traverseFn(ast, visitor);
        return components;
    }
    /**
     * Identifies if a Class node extends React.Component or Component.
     */
    static isClassComponent(node) {
        if (!node.superClass)
            return false;
        // e.g. class MyComp extends Component Let's also support PureComponent
        if (t.isIdentifier(node.superClass) && (node.superClass.name === 'Component' || node.superClass.name === 'PureComponent')) {
            return true;
        }
        // e.g. class MyComp extends React.Component
        if (t.isMemberExpression(node.superClass) &&
            t.isIdentifier(node.superClass.object) &&
            node.superClass.object.name === 'React' &&
            t.isIdentifier(node.superClass.property) &&
            (node.superClass.property.name === 'Component' || node.superClass.property.name === 'PureComponent')) {
            return true;
        }
        return false;
    }
    /**
     * Determines whether a functional node eventually returns JSX.
     * Traverses its local bindings without entering nested functions.
     */
    static returnsJSX(path) {
        let hasJSX = false;
        // Arrow functions with implicit return: `() => <div />`
        if (t.isJSXElement(path.node.body) || t.isJSXFragment(path.node.body)) {
            return true;
        }
        // Traverse the function block for return statements
        path.traverse({
            ReturnStatement(returnPath) {
                const arg = returnPath.node.argument;
                if (!arg)
                    return;
                // Ensure returning JSX expressions
                if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
                    hasJSX = true;
                    returnPath.stop();
                }
            },
            Function(functionPath) {
                // Stop traversal from leaking into nested functions
                functionPath.skip();
            }
        });
        return hasJSX;
    }
    /**
     * Unified factory for metadata to keep properties strictly typed and handle fallback locations.
     */
    static createMetadata(name, type, node) {
        return {
            name,
            type,
            startLine: getSafeLineNumber(node),
            endLine: getSafeEndLineNumber(node),
        };
    }
}
