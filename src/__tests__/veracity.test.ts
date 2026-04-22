import { describe, it } from 'vitest';
import { verifyRuleSuggestion } from '../utils/test-utils.js';
import { ConcurrentScoutRule } from '../analyzer/rules/ConcurrentScoutRule.js';
import { GhostHunterRule } from '../analyzer/rules/GhostHunterRule.js';
import { AntiPatternVisitorRule } from '../analyzer/visitor.js';

describe('Logic Veracity & Context Isolation', () => {

  describe('Concurrent Scout Rule', () => {
    it('should suggest startTransition or useDeferredValue for heavy state updates', () => {
      const code = `
        import React, { useState } from 'react';
        function GridView() {
          const [dataList, setDataList] = useState([]);
          const handleUpdate = () => {
            const heavy = [];
            for (let i=0; i<100; i++) heavy.push(i);
            setDataList(heavy);
          };
          return <DataGrid items={dataList} />;
        }
      `;
      const expected = 'React 18+: Heavy state updates in "setDataList" can block the UI. Wrap in "startTransition" or use "useDeferredValue(dataList)" to keep the interface responsive during concurrent rendering.';
      
      verifyRuleSuggestion(ConcurrentScoutRule, code, expected);
    });
  });

  describe('Ghost Hunter Rule', () => {
    it('should authoritative suggest useEffect or constructor over componentWillMount', () => {
      const code = `
        import React, { Component } from 'react';
        class LegacyComp extends Component {
          UNSAFE_componentWillMount() {
            this.setState({ init: true });
          }
          render() { return <div></div>; }
        }
      `;
      const expected = 'Deprecated Lifecycle: Refactor "UNSAFE_componentWillMount" to "useEffect" or "constructor". Avoid "UNSAFE_" prefixes as they are a temporary patch, not a long-term fix for React 18+.';
      
      verifyRuleSuggestion(GhostHunterRule, code, expected);
    });
  });

  describe('Anti Pattern Visitor', () => {
    it('should strictly flag missing keys during reconciliation', () => {
      const code = `
        function List({ items }) {
          return <ul>{items.map(item => <li>{item}</li>)}</ul>;
        }
      `;
      const expected = 'Reconciliation Warning: Each list item requires a unique "key" prop. Avoid using array indices as they can cause UI bugs and performance degradation during re-renders.';
      
      verifyRuleSuggestion(AntiPatternVisitorRule, code, expected);
    });

    it('should strictly enforce resilience error handling for fetches', () => {
      const code = `
        async function getData() {
          await fetch('/api/data');
        }
      `;
      const expected = 'Resilience Error: This fetch call lacks error handling. Add a ".catch()" block or a try/catch wrapper to prevent silent failures and improve user feedback.';
      
      verifyRuleSuggestion(AntiPatternVisitorRule, code, expected);
    });

    it('should strictly prohibit FindDOMNode for strict mode compliance', () => {
      const code = `
        import ReactDOM from 'react-dom';
        function focusItem() {
          ReactDOM.findDOMNode(this.refs.item);
        }
      `;
      const expected = 'Strict Mode Violation: "findDOMNode" is deprecated and breaks in Concurrent Mode. Use React refs to access DOM elements directly.';
      
      verifyRuleSuggestion(AntiPatternVisitorRule, code, expected);
    });
  });
});
