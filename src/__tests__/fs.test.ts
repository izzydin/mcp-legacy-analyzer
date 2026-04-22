import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fs, vol } from 'memfs';
import { parseSourceCode } from '../utils/parser.js';
import { AnalysisEngine } from '../analyzer/engine.js';
import { GhostHunterRule } from '../analyzer/rules/GhostHunterRule.js';

vi.mock('fs', () => {
  return {
    default: fs,
    ...fs
  };
});

describe('Virtual File System Server Sanity Test', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should read from virtual file system without accessing physical disk', async () => {
    const vfs = {
      '/virtual/workspace/legacy-component.jsx': `
        import React from 'react';
        
        class LegacyComp extends React.Component {
          componentWillMount() {
            console.log("Mounting...");
          }
          render() {
            return <div ref="myDiv">Hello</div>;
          }
        }
      `
    };

    vol.fromJSON(vfs);

    // Verify fs reads from memory seamlessly
    const content = fs.readFileSync('/virtual/workspace/legacy-component.jsx', 'utf-8');
    expect(content).toContain('componentWillMount');
    
    // Verify engine processes the virtual content seamlessly
    const ast = parseSourceCode(content as string);
    const engine = new AnalysisEngine();
    engine.registerRules([GhostHunterRule]);
    const context = engine.execute(ast);
    
    expect(context.diagnostics).toHaveLength(1);
    expect(context.diagnostics[0].ruleId).toBe('ghost-hunter');
  });
});
