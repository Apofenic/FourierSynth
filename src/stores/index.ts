/**
 * Store Index
 *
 * Central export point for all Zustand stores in the application.
 * Stores manage application state using Zustand's lightweight state management.
 */

// Store exports
export { useSynthControlsStore } from "./useSynthControlsStore";
export { useEquationBuilderStore } from "./useEquationBuilderStore";
// export { useAudioEngineStore } from "./useAudioEngineStore"; // TODO: Implement in Phase 2.3

// Import stores for selector type inference
import { useSynthControlsStore } from "./useSynthControlsStore";
import { useEquationBuilderStore } from "./useEquationBuilderStore";

// Re-export types for convenience
export type { HarmonicParam, KeyboardNote } from "../types/synthControlsTypes";

export type {
  EquationBuilderState,
  VariableConfig,
  ParsedExpression,
  CompiledFunction,
  ValidationResult,
  EquationTemplate,
} from "../types/equationBuilderTypes";

/**
 * Common selectors for stores
 *
 * These selectors can be used with stores to efficiently select specific state.
 * Example: const activeNote = useSynthControlsStore(selectActiveNote);
 */

// SynthControls selectors
export const selectActiveNote = (
  state: ReturnType<typeof useSynthControlsStore.getState>
) => {
  if (!state.activeKey) return null;
  return (
    state.keyboardNotes.find((note) => note.key === state.activeKey) || null
  );
};

export const selectActiveFrequency = (
  state: ReturnType<typeof useSynthControlsStore.getState>
) => {
  const activeNote = selectActiveNote(state);
  return activeNote?.frequency || 220; // Default to A3
};

export const selectNonZeroHarmonics = (
  state: ReturnType<typeof useSynthControlsStore.getState>
) => {
  return state.harmonics.filter((h) => h.amplitude > 0);
};

// EquationBuilder selectors
export const selectIsValidExpression = (
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  return state.validationResult.isValid && state.expression.length > 0;
};

export const selectVariableCount = (
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  return Object.keys(state.variables).length;
};

export const selectHasWaveformData = (
  state: ReturnType<typeof useEquationBuilderStore.getState>
) => {
  return state.waveformData.length > 0;
};
