import { describe, it, expect } from 'vitest';
import { getSafeLineNumber, getSafeColumnNumber, getSafeEndLineNumber } from './ast-helpers.js';

describe('ast-helpers', () => {
  it('returns 0 for null/undefined nodes', () => {
    expect(getSafeLineNumber(null)).toBe(0);
    expect(getSafeColumnNumber(undefined)).toBe(0);
    expect(getSafeEndLineNumber(null)).toBe(0);
  });

  it('returns 0 for nodes without loc', () => {
    const node: any = { type: 'Identifier', name: 'test' };
    expect(getSafeLineNumber(node)).toBe(0);
    expect(getSafeColumnNumber(node)).toBe(0);
    expect(getSafeEndLineNumber(node)).toBe(0);
  });

  it('returns correct location values', () => {
    const node: any = {
      type: 'Identifier',
      loc: {
        start: { line: 10, column: 5 },
        end: { line: 12, column: 8 }
      }
    };
    expect(getSafeLineNumber(node)).toBe(10);
    expect(getSafeColumnNumber(node)).toBe(5);
    expect(getSafeEndLineNumber(node)).toBe(12);
  });
});
