import React, {
  createContext,
  useContext,
  useReducer,
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
} from "../types/equationBuilderTypes";
import {
  parseExpression,
  extractVariables,
  compileExpression,
  validateExpression,
  generateLatex,
  createDefaultVariableConfig,
} from "../utils/expressionParser";
import { EquationBuilderAction, EquationBuilderContextValue } from "../types";
import { equationBuilderReducer } from "../reducers/equationBuilderReducer";

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

const EquationBuilderContext =
  createContext<EquationBuilderContextValue | null>(null);

export function EquationBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(equationBuilderReducer, initialState);

  const updateExpression = (newExpression: string) => {
    dispatch({ type: "SET_EXPRESSION", payload: newExpression });
  };

  const updateVariable = (name: string, value: number) => {
    dispatch({ type: "UPDATE_VARIABLE", payload: { name, value } });
  };

  const updateVariableConfig = (
    name: string,
    config: Partial<VariableConfig>
  ) => {
    dispatch({ type: "UPDATE_VARIABLE_CONFIG", payload: { name, config } });
  };

  const resetVariable = (name: string) => {
    dispatch({ type: "RESET_VARIABLE", payload: name });
  };

  const resetAllVariables = () => {
    dispatch({ type: "RESET_ALL_VARIABLES" });
  };

  const loadTemplate = (template: EquationTemplate) => {
    dispatch({ type: "LOAD_TEMPLATE", payload: template });
  };

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

  const value = {
    ...state,
    updateExpression,
    updateVariable,
    updateVariableConfig,
    resetVariable,
    resetAllVariables,
    loadTemplate,
  };

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
