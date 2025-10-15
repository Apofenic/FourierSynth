/**
 * Symbol definitions for the equation builder palette
 * 
 * This module defines all symbols available in the drag-and-drop palette,
 * organized by category for easy browsing and insertion into equations.
 */

import { Symbol } from '../types/equationBuilderTypes';

/**
 * All available symbols organized by category
 */
export const symbols: Symbol[] = [
  // OPERATORS
  {
    id: 'op-add',
    label: '+',
    value: '+',
    category: 'operators',
    description: 'Addition operator',
  },
  {
    id: 'op-subtract',
    label: '−',
    value: '-',
    category: 'operators',
    description: 'Subtraction operator',
  },
  {
    id: 'op-multiply',
    label: '×',
    value: '*',
    category: 'operators',
    description: 'Multiplication operator',
  },
  {
    id: 'op-divide',
    label: '÷',
    value: '/',
    category: 'operators',
    description: 'Division operator',
  },
  {
    id: 'op-power',
    label: '^',
    value: '^',
    category: 'operators',
    description: 'Exponentiation operator',
  },
  {
    id: 'op-sqrt',
    label: '√',
    value: 'sqrt(',
    category: 'operators',
    description: 'Square root function',
  },

  // FUNCTIONS - Trigonometric
  {
    id: 'func-sin',
    label: 'sin',
    value: 'sin(',
    category: 'functions',
    description: 'Sine function',
  },
  {
    id: 'func-cos',
    label: 'cos',
    value: 'cos(',
    category: 'functions',
    description: 'Cosine function',
  },
  {
    id: 'func-tan',
    label: 'tan',
    value: 'tan(',
    category: 'functions',
    description: 'Tangent function',
  },
  {
    id: 'func-asin',
    label: 'asin',
    value: 'asin(',
    category: 'functions',
    description: 'Inverse sine (arcsine)',
  },
  {
    id: 'func-acos',
    label: 'acos',
    value: 'acos(',
    category: 'functions',
    description: 'Inverse cosine (arccosine)',
  },
  {
    id: 'func-atan',
    label: 'atan',
    value: 'atan(',
    category: 'functions',
    description: 'Inverse tangent (arctangent)',
  },

  // FUNCTIONS - Hyperbolic
  {
    id: 'func-sinh',
    label: 'sinh',
    value: 'sinh(',
    category: 'functions',
    description: 'Hyperbolic sine',
  },
  {
    id: 'func-cosh',
    label: 'cosh',
    value: 'cosh(',
    category: 'functions',
    description: 'Hyperbolic cosine',
  },
  {
    id: 'func-tanh',
    label: 'tanh',
    value: 'tanh(',
    category: 'functions',
    description: 'Hyperbolic tangent',
  },

  // FUNCTIONS - Exponential & Logarithmic
  {
    id: 'func-exp',
    label: 'exp',
    value: 'exp(',
    category: 'functions',
    description: 'Exponential function (e^x)',
  },
  {
    id: 'func-log',
    label: 'log',
    value: 'log(',
    category: 'functions',
    description: 'Natural logarithm (base e)',
  },
  {
    id: 'func-log10',
    label: 'log10',
    value: 'log10(',
    category: 'functions',
    description: 'Base-10 logarithm',
  },

  // FUNCTIONS - Other
  {
    id: 'func-abs',
    label: 'abs',
    value: 'abs(',
    category: 'functions',
    description: 'Absolute value',
  },
  {
    id: 'func-ceil',
    label: 'ceil',
    value: 'ceil(',
    category: 'functions',
    description: 'Round up to nearest integer',
  },
  {
    id: 'func-floor',
    label: 'floor',
    value: 'floor(',
    category: 'functions',
    description: 'Round down to nearest integer',
  },
  {
    id: 'func-round',
    label: 'round',
    value: 'round(',
    category: 'functions',
    description: 'Round to nearest integer',
  },
  {
    id: 'func-sign',
    label: 'sign',
    value: 'sign(',
    category: 'functions',
    description: 'Sign of a number (-1, 0, or 1)',
  },
  {
    id: 'func-pow',
    label: 'pow',
    value: 'pow(',
    category: 'functions',
    description: 'Power function (base, exponent)',
  },

  // GREEK LETTERS
  {
    id: 'greek-alpha',
    label: 'α',
    value: 'α',
    category: 'greek',
    description: 'Greek letter alpha',
  },
  {
    id: 'greek-beta',
    label: 'β',
    value: 'β',
    category: 'greek',
    description: 'Greek letter beta',
  },
  {
    id: 'greek-gamma',
    label: 'γ',
    value: 'γ',
    category: 'greek',
    description: 'Greek letter gamma',
  },
  {
    id: 'greek-delta',
    label: 'δ',
    value: 'δ',
    category: 'greek',
    description: 'Greek letter delta',
  },
  {
    id: 'greek-theta',
    label: 'θ',
    value: 'θ',
    category: 'greek',
    description: 'Greek letter theta',
  },
  {
    id: 'greek-lambda',
    label: 'λ',
    value: 'λ',
    category: 'greek',
    description: 'Greek letter lambda',
  },
  {
    id: 'greek-mu',
    label: 'μ',
    value: 'μ',
    category: 'greek',
    description: 'Greek letter mu',
  },
  {
    id: 'greek-pi',
    label: 'π',
    value: 'π',
    category: 'greek',
    description: 'Greek letter pi',
  },
  {
    id: 'greek-sigma',
    label: 'σ',
    value: 'σ',
    category: 'greek',
    description: 'Greek letter sigma',
  },
  {
    id: 'greek-tau',
    label: 'τ',
    value: 'τ',
    category: 'greek',
    description: 'Greek letter tau',
  },
  {
    id: 'greek-phi',
    label: 'φ',
    value: 'φ',
    category: 'greek',
    description: 'Greek letter phi',
  },
  {
    id: 'greek-psi',
    label: 'ψ',
    value: 'ψ',
    category: 'greek',
    description: 'Greek letter psi',
  },
  {
    id: 'greek-omega',
    label: 'ω',
    value: 'ω',
    category: 'greek',
    description: 'Greek letter omega',
  },

  // CONSTANTS
  {
    id: 'const-pi',
    label: 'π',
    value: 'pi',
    category: 'constants',
    description: 'Pi constant (≈3.14159)',
  },
  {
    id: 'const-e',
    label: 'e',
    value: 'e',
    category: 'constants',
    description: "Euler's number (≈2.71828)",
  },

  // BRACKETS
  {
    id: 'bracket-open-paren',
    label: '(',
    value: '(',
    category: 'brackets',
    description: 'Opening parenthesis',
  },
  {
    id: 'bracket-close-paren',
    label: ')',
    value: ')',
    category: 'brackets',
    description: 'Closing parenthesis',
  },
  {
    id: 'bracket-open-square',
    label: '[',
    value: '[',
    category: 'brackets',
    description: 'Opening square bracket',
  },
  {
    id: 'bracket-close-square',
    label: ']',
    value: ']',
    category: 'brackets',
    description: 'Closing square bracket',
  },
];

/**
 * Get symbols by category
 */
export function getSymbolsByCategory(category: Symbol['category']): Symbol[] {
  return symbols.filter((symbol) => symbol.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): Symbol['category'][] {
  return ['operators', 'functions', 'greek', 'constants', 'brackets'];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: Symbol['category']): string {
  const displayNames: Record<Symbol['category'], string> = {
    operators: 'Operators',
    functions: 'Functions',
    greek: 'Greek Letters',
    constants: 'Constants',
    brackets: 'Brackets',
  };
  return displayNames[category];
}

/**
 * Get a symbol by its ID
 */
export function getSymbolById(id: string): Symbol | undefined {
  return symbols.find((symbol) => symbol.id === id);
}
