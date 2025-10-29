/**
 * Expression Parser Utilities
 *
 * This module provides utilities for parsing, validating, compiling, and
 * manipulating mathematical expressions using math.js.
 */

import * as math from "mathjs";
import {
  ParsedExpression,
  CompiledFunction,
  ValidationResult,
  VariableConfig,
} from "../types/equationBuilderTypes";

/**
 * Create a custom math.js instance with summation support
 */
const mathWithSum = math.create(math.all);

/**
 * Custom summation function for math.js
 * Implements: sum(expression, indexVar, start, end)
 * Example: sum(sin(i*t), i, 1, n) = sin(1*t) + sin(2*t) + ... + sin(n*t)
 *
 * The expression parameter should be a MathNode that will be evaluated
 * for each value of the index variable.
 */
function createSumFunction() {
  return function sum(
    expr: any,
    indexVar: string,
    start: number,
    end: number,
    scope?: Record<string, any>
  ): number {
    let result = 0;
    const roundedStart = Math.round(start);
    const roundedEnd = Math.round(end);

    // If expression is not a node, return 0
    if (!expr || typeof expr.evaluate !== "function") {
      return 0;
    }

    for (let iterIndex = roundedStart; iterIndex <= roundedEnd; iterIndex++) {
      try {
        // Create a new scope with the index variable
        const iterationScope = { ...(scope || {}), [indexVar]: iterIndex };

        // Evaluate the expression with the current index
        const value = expr.evaluate(iterationScope);
        result += typeof value === "number" && isFinite(value) ? value : 0;
      } catch (error) {
        // Skip iterations that fail to evaluate
        continue;
      }
    }

    return result;
  };
}

// Register the custom sum function
mathWithSum.import(
  {
    sum: createSumFunction(),
  },
  { override: true }
);

/**
 * Reserved variable names that cannot be used as user variables
 * - t: time variable (always present in waveform functions)
 * - i: used for summation index and imaginary unit
 * - e: Euler's number
 * - n: commonly used for summation upper bound
 */
const RESERVED_VARIABLES = new Set(["t", "i", "e"]);

/**
 * Parse a mathematical expression string into an AST
 *
 * @param expression - The mathematical expression string to parse
 * @returns ParsedExpression containing the AST node and original expression
 * @throws Error if the expression contains syntax errors
 *
 * @example
 * ```typescript
 * const parsed = parseExpression('a*sin(b*t + c)');
 * console.log(parsed.node.type); // 'OperatorNode'
 * ```
 */
export function parseExpression(expression: string): ParsedExpression {
  try {
    const node = mathWithSum.parse(expression);
    return {
      node,
      expression,
    };
  } catch (error) {
    throw new Error(
      `Parse error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract all single-letter variables from an expression
 *
 * Excludes reserved variables (t, i, e) and only includes single-letter
 * identifiers. Returns a sorted unique array.
 *
 * @param expression - The mathematical expression string
 * @returns Array of variable names (sorted, unique, non-reserved)
 *
 * @example
 * ```typescript
 * extractVariables('a*sin(b*t + c)'); // ['a', 'b', 'c']
 * extractVariables('sin(t)'); // []
 * extractVariables('alpha*beta'); // [] (multi-letter not supported)
 * ```
 */
export function extractVariables(expression: string): string[] {
  try {
    const node = math.parse(expression);
    const variables = new Set<string>();

    // Traverse the AST to find all symbol nodes
    node.traverse((node: any) => {
      if (node.type === "SymbolNode") {
        const name = node.name;
        // Only include single-letter variables that aren't reserved
        if (name.length === 1 && !RESERVED_VARIABLES.has(name)) {
          variables.add(name);
        }
      }
    });

    // Return sorted array for consistent ordering
    return Array.from(variables).sort();
  } catch (error) {
    // If parsing fails, return empty array
    return [];
  }
}

/**
 * Compile a parsed expression into a fast evaluable function
 *
 * The compiled function can be called with a scope object containing
 * variable values and will return the evaluated result.
 *
 * @param parsed - The parsed expression from parseExpression()
 * @returns Compiled function that accepts a scope and returns a number
 *
 * @example
 * ```typescript
 * const parsed = parseExpression('a*sin(b*t + c)');
 * const compiled = compileExpression(parsed);
 * const result = compiled({ a: 1, b: 2, t: 0, c: 0 }); // 0
 * ```
 */
export function compileExpression(parsed: ParsedExpression): CompiledFunction {
  try {
    const compiled = parsed.node.compile();

    return (scope: Record<string, number>): number => {
      try {
        const result = compiled.evaluate(scope);
        // Handle edge cases
        if (typeof result !== "number") {
          return 0;
        }
        if (!isFinite(result)) {
          return 0;
        }

        return result;
      } catch (error) {
        // Return 0 for evaluation errors (e.g., division by zero)
        return 0;
      }
    };
  } catch (error) {
    // Return a fallback function that always returns 0
    return () => 0;
  }
}

/**
 * Validate a mathematical expression
 *
 * Checks for syntax errors, reserved variable usage issues, and other
 * potential problems. Returns a ValidationResult with detailed error messages.
 *
 * @param expression - The mathematical expression string to validate
 * @returns ValidationResult indicating if valid and any error messages
 *
 * @example
 * ```typescript
 * validateExpression('a*sin(b*t + c)'); // { isValid: true, errors: [] }
 * validateExpression('a*sin(b*t +'); // { isValid: false, errors: ['Parse error: ...'] }
 * ```
 */
export function validateExpression(expression: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty expression
  if (!expression || expression.trim() === "") {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  // Try to parse the expression
  try {
    const parsed = parseExpression(expression);

    // Check for potential issues
    const variables = extractVariables(expression);

    // Warn if no time variable 't' is used (might produce constant output)
    if (!expression.includes("t")) {
      warnings.push(
        'Expression does not include time variable "t". Waveform will be constant.'
      );
    }

    // Try to compile to catch compilation errors
    try {
      compileExpression(parsed);
    } catch (compileError) {
      errors.push(
        `Compilation error: ${compileError instanceof Error ? compileError.message : String(compileError)}`
      );
    }
  } catch (parseError) {
    errors.push(
      parseError instanceof Error ? parseError.message : String(parseError)
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Generate LaTeX representation of an expression
 * Automatically wraps the expression in summation notation
 *
 * Converts a mathematical expression string into LaTeX format for
 * pretty rendering. Uses math.js built-in toTex() method.
 *
 * @param expression - The mathematical expression string
 * @returns LaTeX string representation with summation
 *
 * @example
 * ```typescript
 * generateLatex('sin(t)'); // '\\sum_{i=1}^{n} \\sin\\left(t\\right)'
 * generateLatex('a*sin(b*t + c)'); // '\\sum_{i=1}^{n} a\\cdot\\sin\\left(b\\cdot t+c\\right)'
 * ```
 */
export function generateLatex(expression: string): string {
  try {
    if (!expression || expression.trim() === "") {
      return "";
    }

    const node = mathWithSum.parse(expression);
    const innerLatex = node.toTex();

    // Wrap in summation notation
    return `\\sum_{i=1}^{n} ${innerLatex}`;
  } catch (error) {
    // Return the original expression wrapped in summation if LaTeX generation fails
    return `\\sum_{i=1}^{n} ${expression}`;
  }
}

/**
 * Create a default variable configuration based on heuristics
 *
 * Analyzes the variable name to infer appropriate default ranges:
 * - Amplitude-like (a, A, amp): [0, 2], step 0.01
 * - Frequency-like (b, f, freq, ω, omega): [0, 10], step 0.1
 * - Phase-like (c, φ, phi, θ, theta): [0, 2π], step π/16
 * - Generic: [0, 2], step 0.01
 *
 * @param name - The variable name
 * @returns VariableConfig with sensible defaults
 *
 * @example
 * ```typescript
 * createDefaultVariableConfig('a'); // { name: 'a', value: 1, min: 0, max: 2, ... }
 * createDefaultVariableConfig('f'); // { name: 'f', value: 1, min: 0, max: 10, ... }
 * ```
 */
export function createDefaultVariableConfig(name: string): VariableConfig {
  const lowerName = name.toLowerCase();

  // Amplitude-like variables
  if (["a", "amp"].includes(lowerName) || name === "A") {
    return {
      name,
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      defaultValue: 1,
    };
  }

  // Frequency-like variables
  if (["b", "f", "freq", "ω", "omega"].includes(lowerName)) {
    return {
      name,
      value: 1,
      min: 0,
      max: 10,
      step: 0.1,
      defaultValue: 1,
    };
  }

  // Phase-like variables
  if (["c", "φ", "phi", "θ", "theta"].includes(lowerName)) {
    const twoPi = 2 * Math.PI;
    return {
      name,
      value: 0,
      min: 0,
      max: twoPi,
      step: twoPi / 16,
      defaultValue: 0,
    };
  }

  // Generic variables
  return {
    name,
    value: 1,
    min: 0,
    max: 2,
    step: 0.01,
    defaultValue: 1,
  };
}

/**
 * Check if a variable name is reserved
 *
 * @param name - Variable name to check
 * @returns true if the variable name is reserved
 */
export function isReservedVariable(name: string): boolean {
  return RESERVED_VARIABLES.has(name);
}

/**
 * Get list of all reserved variable names
 *
 * @returns Array of reserved variable names
 */
export function getReservedVariables(): string[] {
  return Array.from(RESERVED_VARIABLES);
}
