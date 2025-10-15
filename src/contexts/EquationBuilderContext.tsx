import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  EquationBuilderState,
  VariableConfig,
  ParsedExpression,
  CompiledFunction,
  ValidationResult,
  EquationTemplate,
} from "../types/equationBuilder";
import {
  parseExpression,
  extractVariables,
  compileExpression,
  validateExpression,
  generateLatex,
  createDefaultVariableConfig,
} from "../utils/expressionParser";

type EquationBuilderAction =
  | { type: "SET_EXPRESSION"; payload: string }
  | { type: "SET_PARSED_EXPRESSION"; payload: ParsedExpression | null }
  | { type: "SET_COMPILED_FUNCTION"; payload: CompiledFunction | null }
  | { type: "SET_VARIABLES"; payload: Record<string, VariableConfig> }
  | { type: "UPDATE_VARIABLE"; payload: { name: string; value: number } }
  | {
      type: "UPDATE_VARIABLE_CONFIG";
      payload: { name: string; config: Partial<VariableConfig> };
    }
  | { type: "RESET_VARIABLE"; payload: string }
  | { type: "RESET_ALL_VARIABLES" }
  | { type: "SET_LATEX"; payload: string }
  | { type: "SET_VALIDATION"; payload: ValidationResult }
  | { type: "SET_WAVEFORM"; payload: number[] }
  | { type: "LOAD_TEMPLATE"; payload: EquationTemplate };

/**
 * Context value interface including state and methods
 */
interface EquationBuilderContextValue extends EquationBuilderState {
  updateExpression: (newExpression: string) => void;
  updateVariable: (name: string, value: number) => void;
  updateVariableConfig: (name: string, config: Partial<VariableConfig>) => void;
  resetVariable: (name: string) => void;
  resetAllVariables: () => void;
  loadTemplate: (template: EquationTemplate) => void;
}

/**
 * Initial state for the equation builder
 */
const initialState: EquationBuilderState = {
  expression: "",
  parsedExpression: null,
  compiledFunction: null,
  variables: {},
  latexExpression: "",
  validationResult: { isValid: true, errors: [] },
  waveformData: [],
};

/**
 * Reducer function to handle all state updates
 */
function equationBuilderReducer(
  state: EquationBuilderState,
  action: EquationBuilderAction
): EquationBuilderState {
  switch (action.type) {
    case "SET_EXPRESSION":
      return { ...state, expression: action.payload };

    case "SET_PARSED_EXPRESSION":
      return { ...state, parsedExpression: action.payload };

    case "SET_COMPILED_FUNCTION":
      return { ...state, compiledFunction: action.payload };

    case "SET_VARIABLES":
      return { ...state, variables: action.payload };

    case "UPDATE_VARIABLE":
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload.name]: {
            ...state.variables[action.payload.name],
            value: action.payload.value,
          },
        },
      };

    case "UPDATE_VARIABLE_CONFIG":
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload.name]: {
            ...state.variables[action.payload.name],
            ...action.payload.config,
          },
        },
      };

    case "RESET_VARIABLE":
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload]: {
            ...state.variables[action.payload],
            value: state.variables[action.payload].defaultValue,
          },
        },
      };

    case "RESET_ALL_VARIABLES":
      return {
        ...state,
        variables: Object.fromEntries(
          Object.entries(state.variables).map(([name, config]) => [
            name,
            { ...config, value: config.defaultValue },
          ])
        ),
      };

    case "SET_LATEX":
      return { ...state, latexExpression: action.payload };

    case "SET_VALIDATION":
      return { ...state, validationResult: action.payload };

    case "SET_WAVEFORM":
      return { ...state, waveformData: action.payload };

    case 'LOAD_TEMPLATE':
      // Create variables with template values, merging with defaults
      const templateVariables = Object.fromEntries(
        Object.entries(action.payload.variables).map(([name, config]) => {
          const defaults = createDefaultVariableConfig(name);
          return [
            name,
            { 
              ...defaults,
              ...config,
              // Ensure defaultValue is set if value is provided in template
              defaultValue: config.value !== undefined ? config.value : defaults.defaultValue
            }
          ];
        })
      );
      return {
        ...state,
        expression: action.payload.expression,
        variables: templateVariables
      };

    default:
      return state;
  }
}

/**
 * Stub function for waveform calculation
 * Will be implemented in PR #8
 */
function calculateWaveformFromExpression(
  compiledFunction: CompiledFunction,
  variables: Record<string, VariableConfig>,
  sampleCount: number
): number[] {
  // Temporary stub - returns empty array
  // This will be properly implemented in PR #8
  console.log("Waveform calculation stub called - to be implemented in PR #8");
  return [];
}

/**
 * Create the context
 */
const EquationBuilderContext =
  createContext<EquationBuilderContextValue | null>(null);

/**
 * Provider component using useReducer pattern
 */
export function EquationBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(equationBuilderReducer, initialState);

  /**
   * Update the expression string
   */
  const updateExpression = useCallback((newExpression: string) => {
    dispatch({ type: "SET_EXPRESSION", payload: newExpression });
  }, []);

  /**
   * Update a variable's value
   */
  const updateVariable = useCallback((name: string, value: number) => {
    dispatch({ type: "UPDATE_VARIABLE", payload: { name, value } });
  }, []);

  /**
   * Update a variable's configuration (min, max, step, etc.)
   */
  const updateVariableConfig = useCallback(
    (name: string, config: Partial<VariableConfig>) => {
      dispatch({ type: "UPDATE_VARIABLE_CONFIG", payload: { name, config } });
    },
    []
  );

  /**
   * Reset a variable to its default value
   */
  const resetVariable = useCallback((name: string) => {
    dispatch({ type: "RESET_VARIABLE", payload: name });
  }, []);

  /**
   * Reset all variables to their default values
   */
  const resetAllVariables = useCallback(() => {
    dispatch({ type: "RESET_ALL_VARIABLES" });
  }, []);

  /**
   * Load a template equation with its variable configurations
   */
  const loadTemplate = useCallback((template: EquationTemplate) => {
    dispatch({ type: "LOAD_TEMPLATE", payload: template });
  }, []);

  /**
   * Effect: Parse expression when it changes
   * Debounces parsing for 300ms to avoid excessive computation during typing
   */
  useEffect(() => {
    if (!state.expression) {
      dispatch({ type: "SET_PARSED_EXPRESSION", payload: null });
      dispatch({ type: "SET_COMPILED_FUNCTION", payload: null });
      dispatch({
        type: "SET_VALIDATION",
        payload: { isValid: true, errors: [] },
      });
      dispatch({ type: "SET_LATEX", payload: "" });
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const parsed = parseExpression(state.expression);
        const compiled = compileExpression(parsed);
        const validation = validateExpression(state.expression);
        const latex = generateLatex(state.expression);

        dispatch({ type: "SET_PARSED_EXPRESSION", payload: parsed });
        dispatch({ type: "SET_COMPILED_FUNCTION", payload: compiled });
        dispatch({ type: "SET_VALIDATION", payload: validation });
        dispatch({ type: "SET_LATEX", payload: latex });
      } catch (error) {
        dispatch({
          type: "SET_VALIDATION",
          payload: {
            isValid: false,
            errors: [error instanceof Error ? error.message : String(error)],
          },
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.expression]);

  /**
   * Effect: Detect and update variables when parsed expression changes
   * Adds new variables with defaults, removes obsolete ones, preserves existing configurations
   */
  useEffect(() => {
    // Don't clear variables if we're waiting for parsing (expression exists but not parsed yet)
    if (!state.parsedExpression) {
      // Only clear variables if there's also no expression (completely empty state)
      if (!state.expression && Object.keys(state.variables).length > 0) {
        dispatch({ type: "SET_VARIABLES", payload: {} });
      }
      return;
    }

    const detectedVars = extractVariables(state.expression);
    const currentVarNames = Object.keys(state.variables);

    // Check if variables have changed
    const varsChanged =
      detectedVars.length !== currentVarNames.length ||
      detectedVars.some((name) => !state.variables[name]) ||
      currentVarNames.some((name) => !detectedVars.includes(name));

    if (!varsChanged) {
      return;
    }

    const newVariables: Record<string, VariableConfig> = {};

    // Add new variables, preserve ALL existing configuration (including values from templates)
    detectedVars.forEach((varName) => {
      if (state.variables[varName]) {
        // Keep complete existing configuration
        newVariables[varName] = state.variables[varName];
      } else {
        // Create new configuration with defaults
        newVariables[varName] = createDefaultVariableConfig(varName);
      }
    });

    dispatch({ type: "SET_VARIABLES", payload: newVariables });
  }, [state.parsedExpression, state.expression, state.variables]);

  /**
   * Effect: Generate waveform when compiled function or variables change
   * Will be properly implemented in PR #8
   */
  useEffect(() => {
    if (!state.compiledFunction || !state.validationResult.isValid) {
      dispatch({ type: "SET_WAVEFORM", payload: [] });
      return;
    }

    try {
      const waveform = calculateWaveformFromExpression(
        state.compiledFunction,
        state.variables,
        2048
      );
      dispatch({ type: "SET_WAVEFORM", payload: waveform });
    } catch (error) {
      console.error("Waveform generation error:", error);
      dispatch({ type: "SET_WAVEFORM", payload: [] });
    }
  }, [state.compiledFunction, state.variables, state.validationResult.isValid]);

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const value = useMemo(
    () => ({
      ...state,
      updateExpression,
      updateVariable,
      updateVariableConfig,
      resetVariable,
      resetAllVariables,
      loadTemplate,
    }),
    [
      state,
      updateExpression,
      updateVariable,
      updateVariableConfig,
      resetVariable,
      resetAllVariables,
      loadTemplate,
    ]
  );

  return (
    <EquationBuilderContext.Provider value={value}>
      {children}
    </EquationBuilderContext.Provider>
  );
}

/**
 * Hook to access the EquationBuilder context
 *
 * @throws Error if used outside of EquationBuilderProvider
 */
export function useEquationBuilder(): EquationBuilderContextValue {
  const context = useContext(EquationBuilderContext);
  if (!context) {
    throw new Error(
      "useEquationBuilder must be used within EquationBuilderProvider"
    );
  }
  return context;
}
