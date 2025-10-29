import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  EquationBuilderState,
  VariableConfig,
  ParsedExpression,
  CompiledFunction,
  ValidationResult,
  EquationTemplate,
} from "../types/equationBuilderTypes";
import {
  parseExpression,
  extractVariables,
  compileExpression,
  validateExpression,
  generateLatex,
  createDefaultVariableConfig,
} from "../utils/expressionParser";
import { calculateWaveformFromExpression } from "../utils/helperFunctions";

/**
 * EquationBuilderStore State Interface
 * Manages mathematical equation parsing, validation, and waveform generation
 */
interface EquationBuilderStore extends EquationBuilderState {
  // Actions
  updateExpression: (newExpression: string) => void;
  updateVariable: (name: string, value: number) => void;
  updateVariableConfig: (name: string, config: Partial<VariableConfig>) => void;
  resetVariable: (name: string) => void;
  resetAllVariables: () => void;
  loadTemplate: (template: EquationTemplate) => void;

  // Internal actions (prefixed with _)
  _parseExpression: () => void;
  _updateVariables: () => void;
  _generateWaveform: () => void;
}

// Timeout ID for debounced parsing
let parseTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Previous parsed expression for change detection
let prevParsedExpression: ParsedExpression | null = null;

/**
 * Initial state setup
 * Starts with sin(i*t) to create a proper Fourier series with harmonic index
 * Always includes 'n' variable for summation support
 */
const initialExpression = "sin(i*t)";
const initialParsed = parseExpression(initialExpression);
const initialCompiled = compileExpression(initialParsed);
const initialLatex = generateLatex(initialExpression);

const initialVariables: Record<string, VariableConfig> = {
  n: {
    name: "n",
    value: 1,
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 1,
  },
};

/**
 * EquationBuilder Store
 *
 * Manages equation builder state including:
 * - Expression parsing with 300ms debounce
 * - Variable auto-detection (always includes 'n')
 * - LaTeX rendering
 * - Validation
 * - Waveform generation from expressions
 *
 * Note: parsedExpression and compiledFunction are excluded from DevTools
 * as they are non-serializable (AST nodes and functions).
 */
export const useEquationBuilderStore = create<EquationBuilderStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      expression: initialExpression,
      parsedExpression: initialParsed,
      compiledFunction: initialCompiled,
      variables: initialVariables,
      latexExpression: initialLatex,
      validationResult: { isValid: true, errors: [] },
      waveformData: [],

      // Public Actions

      /**
       * Update expression with 300ms debounce for parsing
       */
      updateExpression: (newExpression: string) => {
        set({ expression: newExpression }, false, "updateExpression");

        // Clear existing timeout
        if (parseTimeoutId) {
          clearTimeout(parseTimeoutId);
        }

        // If expression is empty, clear parsed data
        if (!newExpression) {
          set(
            {
              parsedExpression: null,
              compiledFunction: null,
              latexExpression: "",
              validationResult: { isValid: true, errors: [] },
            },
            false,
            "clearParsedData"
          );
          // Keep 'n' variable even when expression is empty
          get()._updateVariables();
          return;
        }

        // Debounce parsing by 300ms
        parseTimeoutId = setTimeout(() => {
          get()._parseExpression();
        }, 300);
      },

      /**
       * Update a variable value and regenerate waveform
       */
      updateVariable: (name: string, value: number) => {
        set(
          (state) => ({
            variables: {
              ...state.variables,
              [name]: {
                ...state.variables[name],
                value,
              },
            },
          }),
          false,
          "updateVariable"
        );

        // Regenerate waveform with new variable value
        get()._generateWaveform();
      },

      /**
       * Update variable configuration (min, max, step, etc.)
       */
      updateVariableConfig: (name: string, config: Partial<VariableConfig>) => {
        set(
          (state) => ({
            variables: {
              ...state.variables,
              [name]: {
                ...state.variables[name],
                ...config,
              },
            },
          }),
          false,
          "updateVariableConfig"
        );
      },

      /**
       * Reset a variable to its default value
       */
      resetVariable: (name: string) => {
        set(
          (state) => ({
            variables: {
              ...state.variables,
              [name]: {
                ...state.variables[name],
                value: state.variables[name].defaultValue,
              },
            },
          }),
          false,
          "resetVariable"
        );

        // Regenerate waveform with reset value
        get()._generateWaveform();
      },

      /**
       * Reset all variables to their default values
       */
      resetAllVariables: () => {
        set(
          (state) => ({
            variables: Object.fromEntries(
              Object.entries(state.variables).map(([name, config]) => [
                name,
                { ...config, value: config.defaultValue },
              ])
            ),
          }),
          false,
          "resetAllVariables"
        );

        // Regenerate waveform with reset values
        get()._generateWaveform();
      },

      /**
       * Load a template equation with pre-configured variables
       */
      loadTemplate: (template: EquationTemplate) => {
        // Create variables with template values, merging with defaults
        const templateVariables = Object.fromEntries(
          Object.entries(template.variables).map(([name, config]) => {
            const defaults = createDefaultVariableConfig(name);
            return [
              name,
              {
                ...defaults,
                ...config,
                // Ensure defaultValue is set if value is provided in template
                defaultValue:
                  config.value !== undefined
                    ? config.value
                    : defaults.defaultValue,
              },
            ];
          })
        );

        set(
          {
            expression: template.expression,
            variables: templateVariables,
          },
          false,
          "loadTemplate"
        );

        // Trigger parsing of new expression
        get()._parseExpression();
      },

      // Internal Actions

      /**
       * Internal: Parse expression and update related state
       */
      _parseExpression: () => {
        const state = get();

        try {
          const parsed = parseExpression(state.expression);
          const compiled = compileExpression(parsed);
          const validation = validateExpression(state.expression);
          const latex = generateLatex(state.expression);

          set(
            {
              parsedExpression: parsed,
              compiledFunction: compiled,
              latexExpression: latex,
              validationResult: validation,
            },
            false,
            "_parseExpression"
          );

          // Update variables based on new parsed expression
          get()._updateVariables();
        } catch (error) {
          set(
            {
              parsedExpression: null,
              compiledFunction: null,
              validationResult: {
                isValid: false,
                errors: [
                  error instanceof Error ? error.message : String(error),
                ],
              },
            },
            false,
            "_parseExpressionError"
          );

          // Clear waveform on parse error
          set({ waveformData: [] }, false, "_clearWaveformOnError");
        }
      },

      /**
       * Internal: Auto-detect and update variables from parsed expression
       * Always keeps 'n' variable for summation support
       */
      _updateVariables: () => {
        const state = get();

        // Only run if parsed expression actually changed
        if (prevParsedExpression === state.parsedExpression) {
          return;
        }
        prevParsedExpression = state.parsedExpression;

        // If no parsed expression, keep only 'n'
        if (!state.parsedExpression) {
          if (!state.expression) {
            const summationVars: Record<string, VariableConfig> = {
              n: state.variables.n || {
                name: "n",
                value: 1,
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 1,
              },
            };
            set({ variables: summationVars }, false, "_updateVariables");
          }
          return;
        }

        const detectedVars = extractVariables(state.expression);

        // Always include 'n' for summation, even if not detected
        const requiredVars = new Set([...detectedVars, "n"]);
        const currentVarNames = Object.keys(state.variables);

        // Check if variables have changed
        const varsChanged =
          requiredVars.size !== currentVarNames.length ||
          Array.from(requiredVars).some((name) => !state.variables[name]) ||
          currentVarNames.some((name) => !requiredVars.has(name));

        if (!varsChanged) {
          get()._generateWaveform();
          return;
        }

        const newVariables: Record<string, VariableConfig> = {};

        // Add new variables, preserve existing configuration
        Array.from(requiredVars).forEach((varName) => {
          if (state.variables[varName]) {
            // Keep complete existing configuration
            newVariables[varName] = state.variables[varName];
          } else {
            // Create new configuration with defaults
            if (varName === "n") {
              newVariables[varName] = {
                name: varName,
                value: 1,
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 1,
              };
            } else {
              newVariables[varName] = createDefaultVariableConfig(varName);
            }
          }
        });

        set({ variables: newVariables }, false, "_updateVariables");

        // Generate waveform with new variables
        get()._generateWaveform();
      },

      /**
       * Internal: Generate waveform from compiled function and variables
       */
      _generateWaveform: () => {
        const state = get();

        if (!state.compiledFunction || !state.validationResult.isValid) {
          set({ waveformData: [] }, false, "_generateWaveform");
          return;
        }

        try {
          const waveform = calculateWaveformFromExpression(
            state.compiledFunction,
            state.variables,
            2048
          );
          set({ waveformData: waveform }, false, "_generateWaveform");
        } catch (error) {
          console.error("Waveform generation error:", error);
          set({ waveformData: [] }, false, "_generateWaveformError");
        }
      },
    }),
    {
      name: "EquationBuilder",
      // Exclude non-serializable state from DevTools
      partialize: (state: EquationBuilderStore) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              key !== "parsedExpression" &&
              key !== "compiledFunction" &&
              !key.startsWith("_")
          )
        ) as Partial<EquationBuilderStore>,
    }
  )
);
