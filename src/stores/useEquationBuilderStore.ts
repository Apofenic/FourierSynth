import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  VariableConfig,
  ParsedExpression,
  EquationTemplate,
  EquationBuilderStore,
  EquationBuilderState,
} from "../types";
import {
  parseExpression,
  extractVariables,
  compileExpression,
  validateExpression,
  generateLatex,
  createDefaultVariableConfig,
} from "../utils/expressionParser";
import { calculateWaveformFromExpression } from "../utils/helperFunctions";

// Timeout IDs for debounced parsing (one per oscillator)
const parseTimeoutIds: (ReturnType<typeof setTimeout> | null)[] = [
  null,
  null,
  null,
  null,
];

// Previous parsed expressions for change detection (one per oscillator)
const prevParsedExpressions: (ParsedExpression | null)[] = [
  null,
  null,
  null,
  null,
];

/**
 * Create initial state for a single oscillator
 */
const createInitialOscillatorState = (): EquationBuilderState => {
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

  return {
    expression: initialExpression,
    parsedExpression: initialParsed,
    compiledFunction: initialCompiled,
    variables: initialVariables,
    latexExpression: initialLatex,
    validationResult: { isValid: true, errors: [] },
    waveformData: calculateWaveformFromExpression(
      initialCompiled,
      initialVariables,
      2048
    ),
  };
};

/**
 * EquationBuilder Store
 *
 * Manages equation builder state for 4 independent oscillators including:
 * - Expression parsing with 300ms debounce (per oscillator)
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
      // Initial State - 4 independent oscillators
      oscillators: [
        createInitialOscillatorState(),
        createInitialOscillatorState(),
        createInitialOscillatorState(),
        createInitialOscillatorState(),
      ],

      // Public Actions

      /**
       * Update expression with 300ms debounce for parsing
       */
      updateExpression: (oscIndex: number, newExpression: string) => {
        set(
          (state) => {
            const oscillators = [...state.oscillators];
            oscillators[oscIndex] = {
              ...oscillators[oscIndex],
              expression: newExpression,
            };
            return { oscillators };
          },
          false,
          "updateExpression"
        );

        // Clear existing timeout for this oscillator
        if (parseTimeoutIds[oscIndex]) {
          clearTimeout(parseTimeoutIds[oscIndex]!);
        }

        // If expression is empty, clear parsed data
        if (!newExpression) {
          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                parsedExpression: null,
                compiledFunction: null,
                latexExpression: "",
                validationResult: { isValid: true, errors: [] },
              };
              return { oscillators };
            },
            false,
            "clearParsedData"
          );
          // Keep 'n' variable even when expression is empty
          get()._updateVariables(oscIndex);
          return;
        }

        // Debounce parsing by 300ms
        parseTimeoutIds[oscIndex] = setTimeout(() => {
          get()._parseExpression(oscIndex);
        }, 300);
      },

      /**
       * Update a variable value and regenerate waveform
       */
      updateVariable: (oscIndex: number, name: string, value: number) => {
        set(
          (state) => {
            const oscillators = [...state.oscillators];
            oscillators[oscIndex] = {
              ...oscillators[oscIndex],
              variables: {
                ...oscillators[oscIndex].variables,
                [name]: {
                  ...oscillators[oscIndex].variables[name],
                  value,
                },
              },
            };
            return { oscillators };
          },
          false,
          "updateVariable"
        );

        // Regenerate waveform with new variable value
        get()._generateWaveform(oscIndex);
      },

      /**
       * Update variable configuration (min, max, step, etc.)
       */
      updateVariableConfig: (
        oscIndex: number,
        name: string,
        config: Partial<VariableConfig>
      ) => {
        set(
          (state) => {
            const oscillators = [...state.oscillators];
            oscillators[oscIndex] = {
              ...oscillators[oscIndex],
              variables: {
                ...oscillators[oscIndex].variables,
                [name]: {
                  ...oscillators[oscIndex].variables[name],
                  ...config,
                },
              },
            };
            return { oscillators };
          },
          false,
          "updateVariableConfig"
        );
      },

      /**
       * Reset a variable to its default value
       */
      resetVariable: (oscIndex: number, name: string) => {
        set(
          (state) => {
            const oscillators = [...state.oscillators];
            const osc = oscillators[oscIndex];
            oscillators[oscIndex] = {
              ...osc,
              variables: {
                ...osc.variables,
                [name]: {
                  ...osc.variables[name],
                  value: osc.variables[name].defaultValue,
                },
              },
            };
            return { oscillators };
          },
          false,
          "resetVariable"
        );

        // Regenerate waveform with reset value
        get()._generateWaveform(oscIndex);
      },

      /**
       * Reset all variables to their default values
       */
      resetAllVariables: (oscIndex: number) => {
        set(
          (state) => {
            const oscillators = [...state.oscillators];
            const osc = oscillators[oscIndex];
            oscillators[oscIndex] = {
              ...osc,
              variables: Object.fromEntries(
                Object.entries(osc.variables).map(([name, config]) => [
                  name,
                  { ...config, value: config.defaultValue },
                ])
              ),
            };
            return { oscillators };
          },
          false,
          "resetAllVariables"
        );

        // Regenerate waveform with reset values
        get()._generateWaveform(oscIndex);
      },

      /**
       * Load a template equation with pre-configured variables
       */
      loadTemplate: (oscIndex: number, template: EquationTemplate) => {
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
          (state) => {
            const oscillators = [...state.oscillators];
            oscillators[oscIndex] = {
              ...oscillators[oscIndex],
              expression: template.expression,
              variables: templateVariables,
            };
            return { oscillators };
          },
          false,
          "loadTemplate"
        );

        // Trigger parsing of new expression
        get()._parseExpression(oscIndex);
      },

      // Internal Actions

      /**
       * Internal: Parse expression and update related state
       */
      _parseExpression: (oscIndex: number) => {
        const state = get();
        const osc = state.oscillators[oscIndex];

        try {
          const parsed = parseExpression(osc.expression);
          const compiled = compileExpression(parsed);
          const validation = validateExpression(osc.expression);
          const latex = generateLatex(osc.expression);

          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                parsedExpression: parsed,
                compiledFunction: compiled,
                latexExpression: latex,
                validationResult: validation,
              };
              return { oscillators };
            },
            false,
            "_parseExpression"
          );

          // Update variables based on new parsed expression
          get()._updateVariables(oscIndex);
        } catch (error) {
          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                parsedExpression: null,
                compiledFunction: null,
                validationResult: {
                  isValid: false,
                  errors: [
                    error instanceof Error ? error.message : String(error),
                  ],
                },
                waveformData: [],
              };
              return { oscillators };
            },
            false,
            "_parseExpressionError"
          );
        }
      },

      /**
       * Internal: Auto-detect and update variables from parsed expression
       * Always keeps 'n' variable for summation support
       */
      _updateVariables: (oscIndex: number) => {
        const state = get();
        const osc = state.oscillators[oscIndex];

        // Only run if parsed expression actually changed
        if (prevParsedExpressions[oscIndex] === osc.parsedExpression) {
          return;
        }
        prevParsedExpressions[oscIndex] = osc.parsedExpression;

        // If no parsed expression, keep only 'n'
        if (!osc.parsedExpression) {
          if (!osc.expression) {
            const summationVars: Record<string, VariableConfig> = {
              n: osc.variables.n || {
                name: "n",
                value: 1,
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 1,
              },
            };
            set(
              (state) => {
                const oscillators = [...state.oscillators];
                oscillators[oscIndex] = {
                  ...oscillators[oscIndex],
                  variables: summationVars,
                };
                return { oscillators };
              },
              false,
              "_updateVariables"
            );
          }
          return;
        }

        const detectedVars = extractVariables(osc.expression);

        // Always include 'n' for summation, even if not detected
        const requiredVars = new Set([...detectedVars, "n"]);
        const currentVarNames = Object.keys(osc.variables);

        // Check if variables have changed
        const varsChanged =
          requiredVars.size !== currentVarNames.length ||
          Array.from(requiredVars).some((name) => !osc.variables[name]) ||
          currentVarNames.some((name) => !requiredVars.has(name));

        if (!varsChanged) {
          get()._generateWaveform(oscIndex);
          return;
        }

        const newVariables: Record<string, VariableConfig> = {};

        // Add new variables, preserve existing configuration
        Array.from(requiredVars).forEach((varName) => {
          if (osc.variables[varName]) {
            // Keep complete existing configuration
            newVariables[varName] = osc.variables[varName];
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

        set(
          (state) => {
            const oscillators = [...state.oscillators];
            oscillators[oscIndex] = {
              ...oscillators[oscIndex],
              variables: newVariables,
            };
            return { oscillators };
          },
          false,
          "_updateVariables"
        );

        // Generate waveform with new variables
        get()._generateWaveform(oscIndex);
      },

      /**
       * Internal: Generate waveform from compiled function and variables
       */
      _generateWaveform: (oscIndex: number) => {
        const state = get();
        const osc = state.oscillators[oscIndex];

        if (!osc.compiledFunction || !osc.validationResult.isValid) {
          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                waveformData: [],
              };
              return { oscillators };
            },
            false,
            "_generateWaveform"
          );
          return;
        }

        try {
          const waveform = calculateWaveformFromExpression(
            osc.compiledFunction,
            osc.variables,
            2048
          );
          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                waveformData: waveform,
              };
              return { oscillators };
            },
            false,
            "_generateWaveform"
          );

          // Sync to SynthControls store if on equation tab
          const { useSynthControlsStore } = require("./useSynthControlsStore");
          const synthState = useSynthControlsStore.getState();

          if (synthState.activeTab === "equation") {
            // Convert to Float32Array and normalize
            const combinedWaveform = new Float32Array(2048);
            for (let i = 0; i < 2048; i++) {
              combinedWaveform[i] = waveform[i] || 0;
            }

            // Normalize waveform to prevent clipping
            const maxAmplitude = Math.max(
              ...Array.from(combinedWaveform).map(Math.abs)
            );
            if (maxAmplitude > 1e-10) {
              for (let i = 0; i < combinedWaveform.length; i++) {
                combinedWaveform[i] /= maxAmplitude;
              }
            }

            synthState.updateOscillatorParam(
              oscIndex,
              "waveformData",
              combinedWaveform
            );
          }
        } catch (error) {
          console.error("Waveform generation error:", error);
          set(
            (state) => {
              const oscillators = [...state.oscillators];
              oscillators[oscIndex] = {
                ...oscillators[oscIndex],
                waveformData: [],
              };
              return { oscillators };
            },
            false,
            "_generateWaveformError"
          );
        }
      },
    }),
    {
      name: "EquationBuilder",
      // Exclude non-serializable state from DevTools
      partialize: (state: EquationBuilderStore) => ({
        oscillators: state.oscillators.map((osc) => ({
          expression: osc.expression,
          variables: osc.variables,
          latexExpression: osc.latexExpression,
          validationResult: osc.validationResult,
          waveformData: osc.waveformData,
          // Exclude non-serializable fields
          parsedExpression: null,
          compiledFunction: null,
        })),
      }),
    }
  )
);

// EquationBuilder selectors
export const selectIsValidExpression = (
  oscIndex: number,
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  const osc = state.oscillators[oscIndex];
  return osc.validationResult.isValid && osc.expression.length > 0;
};

export const selectVariableCount = (
  oscIndex: number,
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  return Object.keys(state.oscillators[oscIndex].variables).length;
};

export const selectHasWaveformData = (
  oscIndex: number,
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  return state.oscillators[oscIndex].waveformData.length > 0;
};
