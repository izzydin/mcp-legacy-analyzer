import { describe, it, expect } from 'vitest';
import { loadFixture } from '../utils/test-utils.js';
import { parseSourceCode } from '../utils/parser.js';
import { AnalysisEngine } from '../analyzer/engine.js';
import { AntiPatternVisitorRule } from '../analyzer/visitor.js';
import { GhostHunterRule } from '../analyzer/rules/GhostHunterRule.js';
import { ConcurrentScoutRule } from '../analyzer/rules/ConcurrentScoutRule.js';
import { Reporter } from '../utils/reporter.js';

describe('Museum of Code: Phase 3 Engine Snapshot Tests', () => {
  it('should generate an accurate Code Health Report for LegacyDashboard.tsx', () => {
    // 1. Load Fixture
    const sourceCode = loadFixture('LegacyDashboard.tsx');
    
    // 2. Parse into AST
    const ast = parseSourceCode(sourceCode);
    
    // 3. Initialize full engine
    const engine = new AnalysisEngine();
    engine.registerRules([
      AntiPatternVisitorRule,
      GhostHunterRule,
      ConcurrentScoutRule
    ]);

    // 4. Execute Analysis
    const context = engine.execute(ast);
    
    // 5. Format using the Reporter
    const report = Reporter.generateHealthReport(context.diagnostics);
    
    // 6. Snapshot Assertion
    expect(report).toMatchSnapshot();
  });

  it('should generate an accurate Code Health Report for LegacyWidget.jsx', () => {
    const sourceCode = loadFixture('LegacyWidget.jsx');
    const ast = parseSourceCode(sourceCode);
    
    const engine = new AnalysisEngine();
    engine.registerRules([
      AntiPatternVisitorRule,
      GhostHunterRule,
      ConcurrentScoutRule
    ]);

    const context = engine.execute(ast);
    const report = Reporter.generateHealthReport(context.diagnostics);
    
    expect(report).toMatchSnapshot();
  });
});
