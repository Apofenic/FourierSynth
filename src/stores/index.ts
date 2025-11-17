/**
 * Store Index
 *
 * Central export point for all Zustand stores in the application.
 * Stores manage application state using Zustand's lightweight state management.
 */

// Import stores for selector type inference
import { useSynthControlsStore } from "./useSynthControlsStore";
import { useEquationBuilderStore } from "./useEquationBuilderStore";
import { useAudioEngineStore } from "./useAudioEngineStore";
import { useSettingsStore } from "./useSettingsStore";

// Store exports
export { useSynthControlsStore } from "./useSynthControlsStore";
export { useEquationBuilderStore } from "./useEquationBuilderStore";
export { useAudioEngineStore, audioNodes } from "./useAudioEngineStore";
export { useSettingsStore } from "./useSettingsStore";

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

// Re-export selectors from each store
export {
  selectActiveNote,
  selectActiveFrequency,
  selectNonZeroHarmonics,
} from "./useSynthControlsStore";

export {
  selectIsValidExpression,
  selectVariableCount,
  selectHasWaveformData,
} from "./useEquationBuilderStore";

export { selectIsPlaying, selectAudioParameters } from "./useAudioEngineStore";

export { selectBufferSize } from "./useSettingsStore";
