/**
 * Modulation Types
 *
 * Type definitions for the modulation matrix system that enables routing
 * modulation sources (oscillators, LFOs, envelopes) to arbitrary parameters.
 */

/**
 * Available modulation sources that can be routed to parameters.
 *
 * - OSC1-4: Oscillator outputs (audio-rate, downsampled to control-rate)
 * - LFO1-2: Low-frequency oscillators (sub-audio periodic modulation)
 * - MOD_ENV: Dedicated modulation envelope (ADSR)
 * - NONE: No modulation source (removes route)
 */
export enum ModulationSource {
  NONE = "none",

  // Oscillators (audio-rate sources)
  OSC1 = "osc1",
  OSC2 = "osc2",
  OSC3 = "osc3",
  OSC4 = "osc4",

  // LFOs (control-rate periodic sources)
  LFO1 = "lfo1",
  LFO2 = "lfo2",

  // Envelopes (control-rate envelope followers)
  MOD_ENV = "mod_env",
}

/**
 * Modulation route connecting a source to a parameter slot.
 *
 * Each parameter can have up to 2 modulation routes (2 slots in ModDial UI).
 */
export interface ModulationRoute {
  /** Unique parameter identifier (e.g., "osc1_detune_octave") */
  paramId: string;

  /** Modulation slot index (0 or 1) */
  slotIndex: number;

  /** Modulation source type */
  source: ModulationSource;

  /** Modulation depth/amount (0-100 percentage) */
  amount: number;

  /**
   * Bipolar modulation flag.
   * - true: modulation ranges from -amount to +amount (symmetric)
   * - false: modulation ranges from 0 to +amount (unipolar)
   */
  bipolar: boolean;
}

/**
 * Current value of a modulation source.
 *
 * Values are normalized to -1 to +1 range regardless of source type.
 */
export interface ModulationSourceValue {
  /** Modulation source type */
  source: ModulationSource;

  /** Normalized value (-1 to +1) */
  value: number;

  /** Timestamp of last update (DOMHighResTimeStamp) */
  timestamp: number;
}

/**
 * Metadata for a modulatable parameter.
 *
 * Defines parameter range, scaling, and update function for Web Audio API.
 */
export interface ParameterMetadata {
  /** Unique parameter identifier */
  paramId: string;

  /** Minimum valid value */
  min: number;

  /** Maximum valid value */
  max: number;

  /** Default/initial value */
  default: number;

  /**
   * Parameter scaling type.
   * - linear: additive scaling (volume, detune)
   * - exponential: multiplicative scaling (frequency, filter cutoff)
   */
  type: "linear" | "exponential";

  /**
   * Update function to apply modulated value to Web Audio API parameter.
   * Called per frame with calculated modulated value.
   */
  updateFn: (value: number) => void;
}

/**
 * Map of parameter ID to modulation routes for that parameter.
 *
 * Example:
 * ```
 * {
 *   "osc1_detune_octave": [
 *     { paramId: "osc1_detune_octave", slotIndex: 0, source: "lfo1", amount: 50, bipolar: true },
 *     { paramId: "osc1_detune_octave", slotIndex: 1, source: "mod_env", amount: 30, bipolar: false }
 *   ]
 * }
 * ```
 */
export type ModulationRoutesMap = Record<string, ModulationRoute[]>;

/**
 * Map of modulation source to current normalized value.
 *
 * Example:
 * ```
 * {
 *   "lfo1": 0.5,
 *   "lfo2": -0.8,
 *   "mod_env": 0.3,
 *   "osc1": 0.1
 * }
 * ```
 */
export type ModulationSourceValuesMap = Record<ModulationSource, number>;

/**
 * Map of parameter ID to parameter metadata.
 *
 * Registry of all modulatable parameters with their valid ranges and update functions.
 */
export type ParameterMetadataMap = Record<string, ParameterMetadata>;
