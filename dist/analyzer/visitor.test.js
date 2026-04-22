import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import { AnalysisEngine } from './engine.js';
import { AntiPatternVisitorRule } from './visitor.js';
describe('AntiPatternVisitorRule', () => {
    let engine;
    beforeEach(() => {
        engine = new AnalysisEngine();
        engine.registerRules([AntiPatternVisitorRule]);
    });
    const parseCode = (code) => parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
    it('should flag STRING_REF', () => {
        const code = `
      function MyComponent() {
        return <div ref="myDiv" />;
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('STRING_REF');
    });
    it('should flag FIND_DOM_NODE', () => {
        const code = `
      function test() {
        ReactDOM.findDOMNode(this);
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('FIND_DOM_NODE');
    });
    it('should flag UNHANDLED_FETCH', () => {
        const code = `
      function fetchData() {
        fetch('/api/data');
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('UNHANDLED_FETCH');
    });
    it('should NOT flag fetch with catch', () => {
        const code = `
      function fetchData() {
        fetch('/api/data').then(res => res.json()).catch(err => console.error(err));
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(0);
    });
    it('should flag MISSING_KEY in map', () => {
        const code = `
      function List() {
        return (
          <div>
            {items.map(item => <span>{item}</span>)}
          </div>
        );
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('MISSING_KEY');
    });
    it('should flag UNUSED_PROPTYPE in Functional Components', () => {
        const code = `
      const MyComp = ({ name }) => {
        return <div>{name}</div>;
      };

      MyComp.propTypes = {
        name: PropTypes.string.isRequired,
        age: PropTypes.number.isRequired
      };
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('UNUSED_PROPTYPE');
        expect(context.diagnostics[0].message).toContain("Required prop 'age' is declared");
    });
    it('should flag UNUSED_PROPTYPE in Class Components', () => {
        const code = `
      class MyClassComp extends React.Component {
        static propTypes = {
          title: PropTypes.string.isRequired,
          count: PropTypes.number.isRequired
        };

        render() {
          return <div>{this.props.title}</div>;
        }
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].ruleId).toBe('UNUSED_PROPTYPE');
        expect(context.diagnostics[0].message).toContain("Required prop 'count' is declared");
    });
});
