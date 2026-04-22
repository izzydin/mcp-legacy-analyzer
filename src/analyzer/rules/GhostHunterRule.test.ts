import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import { AnalysisEngine } from '../engine.js';
import { GhostHunterRule } from './GhostHunterRule.js';

describe('GhostHunterRule', () => {
  let engine: AnalysisEngine;

  beforeEach(() => {
    engine = new AnalysisEngine();
    engine.registerRules([GhostHunterRule]);
  });

  const parseCode = (code: string) => parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  it('should flag componentWillMount', () => {
    const code = `
      class MyComponent extends React.Component {
        componentWillMount() {
          console.log('mounting');
        }
        render() { return null; }
      }
    `;

    const ast = parseCode(code);
    const context = engine.execute(ast);

    expect(context.diagnostics).toHaveLength(1);
    expect(context.diagnostics[0]).toMatchObject({
      ruleId: 'ghost-hunter',
      severity: 'warning',
    });
    expect(context.diagnostics[0].message).toContain('deprecated and unsafe for React 18 Concurrent Mode');
    expect(context.diagnostics[0].action).toContain('componentDidMount or constructor');
  });

  it('should flag componentWillReceiveProps', () => {
    const code = `
      class MyComponent extends React.Component {
        componentWillReceiveProps(nextProps) {
          console.log('receiving props');
        }
        render() { return null; }
      }
    `;

    const ast = parseCode(code);
    const context = engine.execute(ast);

    expect(context.diagnostics).toHaveLength(1);
    expect(context.diagnostics[0].action).toContain('static getDerivedStateFromProps');
  });

  it('should flag componentWillUpdate', () => {
    const code = `
      class MyComponent extends React.Component {
        componentWillUpdate(nextProps, nextState) {
          console.log('updating');
        }
        render() { return null; }
      }
    `;

    const ast = parseCode(code);
    const context = engine.execute(ast);

    expect(context.diagnostics).toHaveLength(1);
    expect(context.diagnostics[0].action).toContain('getSnapshotBeforeUpdate');
  });

  it('should flag UNSAFE_ prefixed methods', () => {
    const code = `
      class MyComponent extends React.Component {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillReceiveProps() {}
        UNSAFE_componentWillUpdate() {}
        render() { return null; }
      }
    `;

    const ast = parseCode(code);
    const context = engine.execute(ast);

    expect(context.diagnostics).toHaveLength(3);
  });

  it('should not flag valid lifecycle methods', () => {
    const code = `
      class MyComponent extends React.Component {
        componentDidMount() {}
        componentDidUpdate() {}
        render() { return null; }
      }
    `;

    const ast = parseCode(code);
    const context = engine.execute(ast);

    expect(context.diagnostics).toHaveLength(0);
  });
});
