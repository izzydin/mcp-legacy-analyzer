import traverse from '@babel/traverse';
import { ComponentVisitor } from './visitors/ComponentVisitor.js';
export class Context {
    diagnostics = [];
    components = [];
    report(diagnostic) {
        this.diagnostics.push(diagnostic);
    }
}
export class AnalysisEngine {
    rules = [];
    /**
     * Registers a list of analysis rules to be executed.
     */
    registerRules(rules) {
        this.rules.push(...rules);
    }
    /**
     * Executes the analysis engine on the provided AST using a Single-Pass strategy.
     *
     * Stage 1: Component metadata is extracted.
     * Stage 2: All registered rule visitors are merged and run in a single AST traversal.
     *
     * @param ast The parsed Babel File node
     * @returns The context containing collected diagnostics and component metadata
     */
    execute(ast) {
        const context = new Context();
        // Stage 1: Component Metadata Extraction
        context.components = ComponentVisitor.extractComponents(ast);
        // Stage 2: Merged Audit (Single-Pass)
        if (this.rules.length > 0) {
            // Map to just the visitors for merging
            const visitors = this.rules.map(rule => rule.visitor);
            // Handle Babel's ESM interop for the traverse function/object
            const traverseObj = typeof traverse === 'function' ? traverse : traverse.default || traverse;
            const mergeFn = traverseObj.visitors?.merge || traverseObj.default?.visitors?.merge;
            if (mergeFn) {
                const mergedVisitor = mergeFn(visitors);
                // Execute single pass with merged visitor and context as state
                if (typeof traverseObj === 'function') {
                    traverseObj(ast, mergedVisitor, undefined, context);
                }
                else if (typeof traverseObj.default === 'function') {
                    traverseObj.default(ast, mergedVisitor, undefined, context);
                }
                else {
                    throw new Error("Unable to execute traverse: No traverse function found.");
                }
            }
            else {
                throw new Error("Unable to merge visitors: traverse.visitors.merge not found.");
            }
        }
        return context;
    }
}
