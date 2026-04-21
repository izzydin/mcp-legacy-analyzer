import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import { AnalysisEngine } from '../engine.js';
import { ConcurrentScoutRule } from './ConcurrentScoutRule.js';
describe('ConcurrentScoutRule', () => {
    let engine;
    beforeEach(() => {
        engine = new AnalysisEngine();
        engine.registerRules([ConcurrentScoutRule]);
    });
    const parseCode = (code) => parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
    it('should flag state updated in a loop and passed to a List component', () => {
        const code = `
      function MyComponent() {
        const [results, setResults] = useState([]);

        const handleSearch = (query) => {
          let newResults = [];
          for (let i = 0; i < 1000; i++) {
            newResults.push(query + i);
          }
          setResults(newResults);
        };

        return <SearchResultsList data={results} />;
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0]).toMatchObject({
            ruleId: 'concurrent-scout',
            severity: 'suggestion'
        });
        expect(context.diagnostics[0].message).toContain("Consider wrapping the 'setResults' update in 'startTransition'");
        expect(context.diagnostics[0].message).toContain('useDeferredValue(results)');
    });
    it('should flag state updated via array map and passed to a Grid component', () => {
        const code = `
      function ProductView() {
        const [items, setItems] = React.useState([]);

        const applyFilter = (filterVal) => {
          setItems(prev => prev.map(item => ({ ...item, active: item.val === filterVal })));
        };

        return <DataGrid items={items} />;
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(1);
        expect(context.diagnostics[0].message).toContain('<DataGrid>');
    });
    it('should NOT flag state if passed to a heavy component but NOT updated via complex ops', () => {
        const code = `
      function SimpleList() {
        const [items, setItems] = useState([]);

        const handleClear = () => {
          setItems([]); // Simple operation, no loops or map/filter
        };

        return <MyTable data={items} />;
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(0);
    });
    it('should NOT flag state if updated via complex ops but NOT passed to a heavy component', () => {
        const code = `
      function DataProcessor() {
        const [data, setData] = useState([]);

        const process = () => {
          const res = [1,2,3].filter(x => x > 1);
          setData(res);
        };

        return <div>{data.length}</div>; // 'div' is not a heavy component
      }
    `;
        const ast = parseCode(code);
        const context = engine.execute(ast);
        expect(context.diagnostics).toHaveLength(0);
    });
});
