import {
  EquationBuilderState,
  EquationBuilderAction,
} from "../types/equationBuilderTypes";
import { createDefaultVariableConfig } from "../utils/expressionParser";

/**
 * Reducer function to handle all state updates for EquationBuilder
 * 
 * This reducer manages the state transitions for the equation builder,
 * including expression updates, variable management, and template loading.
 */
export function equationBuilderReducer(
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

    case "LOAD_TEMPLATE":
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
              defaultValue:
                config.value !== undefined
                  ? config.value
                  : defaults.defaultValue,
            },
          ];
        })
      );
      return {
        ...state,
        expression: action.payload.expression,
        variables: templateVariables,
      };

    default:
      return state;
  }
}
