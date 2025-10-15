/**
 * Type definitions for the Equation Builder feature
 * 
 * This module defines the core types and interfaces used throughout
 * the equation builder system for parsing, validating, and evaluating
 * custom mathematical expressions.
 */

import { MathNode } from 'mathjs';

/**
 * Configuration for a single variable in an equation
 * 
 * Variables are single-letter identifiers (excluding reserved: t, i, e)
 * that can be controlled via sliders in the UI.
 */
export interface VariableConfig {
  /** Variable identifier (single letter, e.g., 'a', 'b', 'c') */
  name: string;
  
  /** Current value of the variable */
  value: number;
  
  /** Minimum allowed value */
  min: number;
  
  /** Maximum allowed value */
  max: number;
  
  /** Step size for slider adjustments */
  step: number;
  
  /** Default value to reset to */
  defaultValue: number;
}

/**
 * Parsed expression from math.js
 * 
 * Represents the Abstract Syntax Tree (AST) of a mathematical expression
 * after parsing with math.js.
 */
export interface ParsedExpression {
  /** The AST node from math.js */
  node: MathNode;
  
  /** Original expression string */
  expression: string;
}

/**
 * Compiled function that can evaluate the expression
 * 
 * A pre-compiled, optimized function for fast evaluation with
 * different variable values.
 */
export type CompiledFunction = (scope: Record<string, number>) => number;

/**
 * Result of expression validation
 * 
 * Contains validation status and any error messages to display to the user.
 */
export interface ValidationResult {
  /** Whether the expression is valid */
  isValid: boolean;
  
  /** Array of error messages (empty if valid) */
  errors: string[];
  
  /** Optional warning messages */
  warnings?: string[];
}

/**
 * Complete state for the Equation Builder
 * 
 * This interface defines all state managed by the EquationBuilderContext.
 */
export interface EquationBuilderState {
  /** Raw expression string entered by user */
  expression: string;
  
  /** Parsed AST from math.js (null if not yet parsed or invalid) */
  parsedExpression: ParsedExpression | null;
  
  /** Compiled evaluable function (null if not yet compiled or invalid) */
  compiledFunction: CompiledFunction | null;
  
  /** Map of variable name to configuration */
  variables: Record<string, VariableConfig>;
  
  /** LaTeX representation of the expression */
  latexExpression: string;
  
  /** Current validation result */
  validationResult: ValidationResult;
  
  /** Generated waveform data for visualization and audio */
  waveformData: number[];
}

/**
 * Template for preset equations
 * 
 * Pre-configured equations with default variable values for quick start.
 */
export interface EquationTemplate {
  /** Unique identifier for the template */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of what the equation produces */
  description: string;
  
  /** The mathematical expression */
  expression: string;
  
  /** Default variable configurations */
  variables: Record<string, Partial<VariableConfig>>;
  
  /** Category for organization */
  category: 'basic' | 'synthesis' | 'advanced';
}

/**
 * Symbol for the symbol palette
 * 
 * Represents a draggable/clickable symbol in the palette UI.
 */
export interface Symbol {
  /** Unique identifier */
  id: string;
  
  /** Display label (may include Unicode or HTML) */
  label: string;
  
  /** Actual value to insert into expression */
  value: string;
  
  /** Category for grouping */
  category: 'operators' | 'functions' | 'greek' | 'constants' | 'brackets';
  
  /** Tooltip description */
  description: string;
}
