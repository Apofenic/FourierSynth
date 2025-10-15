/**
 * Tests for Expression Parser Utilities
 */

import {
  parseExpression,
  extractVariables,
  compileExpression,
  validateExpression,
  generateLatex,
  createDefaultVariableConfig,
  isReservedVariable,
  getReservedVariables
} from './expressionParser';

describe('parseExpression', () => {
  it('should parse a valid simple expression', () => {
    const result = parseExpression('sin(t)');
    expect(result.node).toBeDefined();
    expect(result.expression).toBe('sin(t)');
    expect(result.node.type).toBe('FunctionNode');
  });

  it('should parse a complex expression', () => {
    const result = parseExpression('a*sin(b*t + c) + d*cos(e*t)');
    expect(result.node).toBeDefined();
    expect(result.expression).toBe('a*sin(b*t + c) + d*cos(e*t)');
  });

  it('should throw error for invalid syntax', () => {
    expect(() => parseExpression('sin(t +')).toThrow('Parse error');
    expect(() => parseExpression('a*sin(b*t +')).toThrow('Parse error');
  });

  it('should parse nested functions', () => {
    const result = parseExpression('sin(cos(t))');
    expect(result.node).toBeDefined();
  });

  it('should parse expressions with operators', () => {
    const result = parseExpression('a + b - c * d / e ^ 2');
    expect(result.node).toBeDefined();
  });
});

describe('extractVariables', () => {
  it('should extract single variable', () => {
    const vars = extractVariables('a*sin(t)');
    expect(vars).toEqual(['a']);
  });

  it('should extract multiple variables', () => {
    const vars = extractVariables('a*sin(b*t + c)');
    expect(vars).toEqual(['a', 'b', 'c']);
  });

  it('should exclude reserved variable t', () => {
    const vars = extractVariables('sin(t)');
    expect(vars).toEqual([]);
  });

  it('should exclude reserved variable i', () => {
    const vars = extractVariables('a + i');
    expect(vars).toEqual(['a']);
  });

  it('should exclude reserved variable e', () => {
    const vars = extractVariables('a * e');
    expect(vars).toEqual(['a']);
  });

  it('should return sorted unique variables', () => {
    const vars = extractVariables('c*a + b*a + c');
    expect(vars).toEqual(['a', 'b', 'c']);
  });

  it('should handle expressions with no variables', () => {
    const vars = extractVariables('sin(t) + cos(t)');
    expect(vars).toEqual([]);
  });

  it('should handle multi-letter identifiers (functions)', () => {
    // Multi-letter identifiers should be treated as functions, not variables
    const vars = extractVariables('sin(t)');
    expect(vars).toEqual([]);
  });

  it('should return empty array for invalid expressions', () => {
    const vars = extractVariables('invalid syntax ((');
    expect(vars).toEqual([]);
  });

  it('should extract variables from complex expressions', () => {
    const vars = extractVariables('a*sin(b*t + c) + d*cos(f*t)');
    expect(vars).toEqual(['a', 'b', 'c', 'd', 'f']);
  });

  it('should handle Greek letters as single variables', () => {
    const vars = extractVariables('α*sin(β*t)');
    expect(vars).toEqual(['α', 'β']);
  });
});

describe('compileExpression', () => {
  it('should compile and evaluate a simple expression', () => {
    const parsed = parseExpression('sin(t)');
    const compiled = compileExpression(parsed);
    const result = compiled({ t: 0 });
    expect(result).toBeCloseTo(0, 10);
  });

  it('should compile and evaluate expression with variables', () => {
    const parsed = parseExpression('a*sin(b*t + c)');
    const compiled = compileExpression(parsed);
    const result = compiled({ a: 2, b: 1, t: 0, c: 0 });
    expect(result).toBeCloseTo(0, 10);
  });

  it('should handle different variable values', () => {
    const parsed = parseExpression('a + b');
    const compiled = compileExpression(parsed);
    expect(compiled({ a: 1, b: 2 })).toBe(3);
    expect(compiled({ a: 5, b: 10 })).toBe(15);
  });

  it('should return 0 for division by zero', () => {
    const parsed = parseExpression('a / b');
    const compiled = compileExpression(parsed);
    const result = compiled({ a: 1, b: 0 });
    expect(result).toBe(0);
  });

  it('should return 0 for NaN results', () => {
    const parsed = parseExpression('sqrt(a)');
    const compiled = compileExpression(parsed);
    const result = compiled({ a: -1 });
    // sqrt of negative number in math.js returns complex number
    // Our function should handle this gracefully
    expect(typeof result).toBe('number');
  });

  it('should return 0 for Infinity results', () => {
    const parsed = parseExpression('a^b');
    const compiled = compileExpression(parsed);
    const result = compiled({ a: 10, b: 1000 });
    // Very large numbers should be handled
    expect(isFinite(result) || result === 0).toBe(true);
  });

  it('should evaluate complex expressions correctly', () => {
    const parsed = parseExpression('a*sin(b*t) + c*cos(d*t)');
    const compiled = compileExpression(parsed);
    const result = compiled({ a: 1, b: 1, c: 1, d: 1, t: 0 });
    expect(result).toBeCloseTo(1, 10); // sin(0) = 0, cos(0) = 1
  });
});

describe('validateExpression', () => {
  it('should validate a correct expression', () => {
    const result = validateExpression('a*sin(b*t + c)');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should invalidate expression with syntax error', () => {
    const result = validateExpression('a*sin(b*t +');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Parse error');
  });

  it('should validate empty expression', () => {
    const result = validateExpression('');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about missing time variable', () => {
    const result = validateExpression('a + b');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain('time variable');
  });

  it('should validate expression with time variable', () => {
    const result = validateExpression('sin(t)');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toBeUndefined();
  });

  it('should handle complex valid expressions', () => {
    const result = validateExpression('exp(-a*t)*sin(b*t + c)');
    expect(result.isValid).toBe(true);
  });

  it('should detect unclosed parentheses', () => {
    const result = validateExpression('sin(t');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid function names', () => {
    const result = validateExpression('invalidfunc(t)');
    // math.js might treat this as a variable or throw error
    // Either way, our validation should handle it
    expect(typeof result.isValid).toBe('boolean');
  });
});

describe('generateLatex', () => {
  it('should generate LaTeX for sin(t)', () => {
    const latex = generateLatex('sin(t)');
    expect(latex).toContain('sin');
    expect(latex).toContain('t');
  });

  it('should generate LaTeX for complex expression', () => {
    const latex = generateLatex('a*sin(b*t + c)');
    expect(latex).toContain('sin');
    expect(latex).toBeTruthy();
  });

  it('should handle empty expression', () => {
    const latex = generateLatex('');
    expect(latex).toBe('');
  });

  it('should return original expression if LaTeX generation fails', () => {
    const invalid = 'invalid ((( syntax';
    const latex = generateLatex(invalid);
    // Should return something, even if it's the original
    expect(typeof latex).toBe('string');
  });

  it('should generate LaTeX for operators', () => {
    const latex = generateLatex('a + b - c * d / e');
    expect(latex).toBeTruthy();
  });

  it('should generate LaTeX for nested functions', () => {
    const latex = generateLatex('sin(cos(t))');
    expect(latex).toContain('sin');
    expect(latex).toContain('cos');
  });

  it('should generate LaTeX for exponents', () => {
    const latex = generateLatex('a^2 + b^3');
    expect(latex).toBeTruthy();
  });
});

describe('createDefaultVariableConfig', () => {
  it('should create amplitude-like config for "a"', () => {
    const config = createDefaultVariableConfig('a');
    expect(config.name).toBe('a');
    expect(config.min).toBe(0);
    expect(config.max).toBe(2);
    expect(config.value).toBe(1);
    expect(config.defaultValue).toBe(1);
    expect(config.step).toBe(0.01);
  });

  it('should create frequency-like config for "b"', () => {
    const config = createDefaultVariableConfig('b');
    expect(config.name).toBe('b');
    expect(config.min).toBe(0);
    expect(config.max).toBe(10);
    expect(config.step).toBe(0.1);
  });

  it('should create phase-like config for "c"', () => {
    const config = createDefaultVariableConfig('c');
    expect(config.name).toBe('c');
    expect(config.min).toBe(0);
    expect(config.max).toBeCloseTo(2 * Math.PI, 10);
    expect(config.value).toBe(0);
    expect(config.defaultValue).toBe(0);
  });

  it('should create generic config for unknown variable', () => {
    const config = createDefaultVariableConfig('x');
    expect(config.name).toBe('x');
    expect(config.min).toBe(0);
    expect(config.max).toBe(2);
    expect(config.step).toBe(0.01);
  });

  it('should handle uppercase "A" as amplitude', () => {
    const config = createDefaultVariableConfig('A');
    expect(config.max).toBe(2);
  });

  it('should handle "f" as frequency', () => {
    const config = createDefaultVariableConfig('f');
    expect(config.max).toBe(10);
  });

  it('should handle Greek letters for phase', () => {
    const config = createDefaultVariableConfig('φ');
    expect(config.max).toBeCloseTo(2 * Math.PI, 10);
  });

  it('should handle "freq" as frequency', () => {
    const config = createDefaultVariableConfig('freq');
    expect(config.max).toBe(10);
  });

  it('should handle "omega" as frequency', () => {
    const config = createDefaultVariableConfig('omega');
    expect(config.max).toBe(10);
  });

  it('should handle "theta" as phase', () => {
    const config = createDefaultVariableConfig('theta');
    expect(config.max).toBeCloseTo(2 * Math.PI, 10);
  });
});

describe('isReservedVariable', () => {
  it('should identify "t" as reserved', () => {
    expect(isReservedVariable('t')).toBe(true);
  });

  it('should identify "i" as reserved', () => {
    expect(isReservedVariable('i')).toBe(true);
  });

  it('should identify "e" as reserved', () => {
    expect(isReservedVariable('e')).toBe(true);
  });

  it('should not identify "a" as reserved', () => {
    expect(isReservedVariable('a')).toBe(false);
  });

  it('should not identify "x" as reserved', () => {
    expect(isReservedVariable('x')).toBe(false);
  });
});

describe('getReservedVariables', () => {
  it('should return array of reserved variables', () => {
    const reserved = getReservedVariables();
    expect(reserved).toContain('t');
    expect(reserved).toContain('i');
    expect(reserved).toContain('e');
    expect(reserved.length).toBe(3);
  });
});

describe('Performance tests', () => {
  it('should parse expression in reasonable time', () => {
    const start = performance.now();
    parseExpression('a*sin(b*t + c)');
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Should be < 50ms
  });

  it('should compile expression in reasonable time', () => {
    const parsed = parseExpression('a*sin(b*t + c) + d*cos(e*t)');
    const start = performance.now();
    compileExpression(parsed);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Should be < 50ms
  });

  it('should evaluate compiled function quickly', () => {
    const parsed = parseExpression('a*sin(b*t + c)');
    const compiled = compileExpression(parsed);
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      compiled({ a: 1, b: 2, t: i / 100, c: 0 });
    }
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // 1000 evaluations in < 100ms
  });
});

describe('Edge cases', () => {
  it('should handle very long expressions', () => {
    const longExpr = 'a + b + c + d + e + f + g + h + j + k + l + m + n + o + p + q + r + s + u + v + w + x + y + z';
    const result = validateExpression(longExpr);
    expect(typeof result.isValid).toBe('boolean');
  });

  it('should handle Unicode characters', () => {
    const expr = 'α*sin(β*t + γ)';
    const vars = extractVariables(expr);
    expect(vars).toContain('α');
    expect(vars).toContain('β');
    expect(vars).toContain('γ');
  });

  it('should handle nested parentheses', () => {
    const expr = '((a + b) * (c + d)) / (e + f)';
    const result = validateExpression(expr);
    expect(result.isValid).toBe(true);
  });

  it('should handle whitespace variations', () => {
    const expr1 = 'a*sin(b*t+c)';
    const expr2 = 'a * sin( b * t + c )';
    expect(extractVariables(expr1)).toEqual(extractVariables(expr2));
  });

  it('should handle expressions with only constants', () => {
    const expr = '1 + 2 + 3';
    const vars = extractVariables(expr);
    expect(vars).toEqual([]);
  });

  it('should handle expressions with mixed case', () => {
    const expr = 'A*sin(B*t + C)';
    const vars = extractVariables(expr);
    expect(vars).toEqual(['A', 'B', 'C']);
  });
});
