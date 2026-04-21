import traverse, { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { ComponentVisitor, ComponentMetadata } from './visitors/ComponentVisitor.js';

export interface Diagnostic {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
  line: number;
  column: number;
}

export class Context {
  public diagnostics: Diagnostic[] = [];
  public components: ComponentMetadata[] = [];

  report(diagnostic: Diagnostic) {
    this.diagnostics.push(diagnostic);
  }
}

export interface AnalysisRule {
  id: string;
  visitor: Visitor<Context>;
}

export class AnalysisEngine {
  private rules: AnalysisRule[] = [];

  /**
   * Registers a list of analysis rules to be executed.
   */
  public registerRules(rules: AnalysisRule[]) {
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
  public execute(ast: t.File): Context {
    const context = new Context();

    // Stage 1: Component Metadata Extraction
    context.components = ComponentVisitor.extractComponents(ast);

    // Stage 2: Merged Audit (Single-Pass)
    if (this.rules.length > 0) {
      // Map to just the visitors for merging
      const visitors = this.rules.map(rule => rule.visitor);
      
      // Handle Babel's ESM interop for the traverse function/object
      const traverseObj = typeof traverse === 'function' ? traverse : (traverse as any).default || traverse;
      const mergeFn = traverseObj.visitors?.merge || traverseObj.default?.visitors?.merge;

      if (mergeFn) {
        const mergedVisitor = mergeFn(visitors);
        
        // Execute single pass with merged visitor and context as state
        if (typeof traverseObj === 'function') {
          traverseObj(ast, mergedVisitor, undefined, context);
        } else if (typeof traverseObj.default === 'function') {
          traverseObj.default(ast, mergedVisitor, undefined, context);
        } else {
           throw new Error("Unable to execute traverse: No traverse function found.");
        }
      } else {
         throw new Error("Unable to merge visitors: traverse.visitors.merge not found.");
      }
    }

    return context;
  }
}
