/**
 * Store Index
 *
 * Central export point for all Zustand stores in the application.
 * Stores manage application state using Zustand's lightweight state management.
 */

// Import stores for selector type inference
import { useSynthControlsStore } from "./useSynthControlsStore";
import { useEquationBuilderStore } from "./useEquationBuilderStore";
import { useAudioEngineStore } from "./AudioEngine/audioEngineStore";
import { useSettingsStore } from "./useSettingsStore";
import { useModulationStore } from "./useModulationStore";

// Store exports
export { useSynthControlsStore } from "./useSynthControlsStore";
export { useEquationBuilderStore } from "./useEquationBuilderStore";
export {
  useAudioEngineStore,
  audioNodes,
} from "./AudioEngine/audioEngineStore";
export { useSettingsStore } from "./useSettingsStore";
export { useModulationStore } from "./useModulationStore";

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

export {
  selectIsPlaying,
  selectAudioParameters,
} from "./AudioEngine/audioEngineStore";

export { selectBufferSize } from "./useSettingsStore";

export {
  selectHasModulation,
  selectTotalRouteCount,
  selectIsSourceActive,
} from "./useModulationStore";
