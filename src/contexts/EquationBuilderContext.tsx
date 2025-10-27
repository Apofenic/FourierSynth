import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
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
import { calculateWaveformFromExpression } from "../utils/helperFunctions";
import { EquationBuilderAction, EquationBuilderContextValue } from "../types";
import { equationBuilderReducer } from "../reducers/equationBuilderReducer";

/**
 * Initial state for the equation builder
 * Starts with sin(i*t) to create a proper Fourier series with harmonic index
 * Always includes 'n' variable for summation support
 * When n=1, shows only fundamental; when n>1, shows partial series sum
 */
const initialExpression = "sin(i*t)";
const initialParsed = parseExpression(initialExpression);
const initialCompiled = compileExpression(initialParsed);
const initialLatex = generateLatex(initialExpression);

// Create initial variables with n for summation
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

const initialState: EquationBuilderState = {
  expression: initialExpression,
  parsedExpression: initialParsed,
  compiledFunction: initialCompiled,
  variables: initialVariables,
  latexExpression: initialLatex,
  validationResult: { isValid: true, errors: [] },
  waveformData: [],
};

const EquationBuilderContext =
  createContext<EquationBuilderContextValue | null>(null);

export function EquationBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(equationBuilderReducer, initialState);
  const prevParsedExpressionRef = useRef<ParsedExpression | null>(null);

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
   * ALWAYS keeps 'n' variable for summation support
   */
  useEffect(() => {
    // Only run if parsed expression actually changed
    if (prevParsedExpressionRef.current === state.parsedExpression) {
      return;
    }
    prevParsedExpressionRef.current = state.parsedExpression;

    // Don't clear variables if we're waiting for parsing (expression exists but not parsed yet)
    if (!state.parsedExpression) {
      // Keep n even if expression is empty
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
        dispatch({ type: "SET_VARIABLES", payload: summationVars });
      }
      return;
    }

    const detectedVars = extractVariables(state.expression);

    // Always include 'n' for summation, even if not detected in expression
    const requiredVars = new Set([...detectedVars, "n"]);
    const currentVarNames = Object.keys(state.variables);

    // Check if variables have changed
    const varsChanged =
      requiredVars.size !== currentVarNames.length ||
      Array.from(requiredVars).some((name) => !state.variables[name]) ||
      currentVarNames.some((name) => !requiredVars.has(name));

    if (!varsChanged) {
      return;
    }

    const newVariables: Record<string, VariableConfig> = {};

    // Add new variables, preserve ALL existing configuration (including values from templates)
    Array.from(requiredVars).forEach((varName) => {
      if (state.variables[varName]) {
        // Keep complete existing configuration
        newVariables[varName] = state.variables[varName];
      } else {
        // Create new configuration with defaults
        // Special defaults for summation variables
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

    dispatch({ type: "SET_VARIABLES", payload: newVariables });
  }, [state.parsedExpression, state.expression, state.variables]); // Safe to include all now with ref check

  /**
   * Effect: Generate waveform when compiled function or variables change
   * Uses calculateWaveformFromExpression from helperFunctions.ts
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
