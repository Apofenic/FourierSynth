/**
 * Parameter ID Constants
 *
 * Central registry of all parameter IDs used in the modulation system.
 * These IDs must match exactly with those used in parameterRegistry.ts
 */

/**
 * Oscillator Parameter IDs
 * Format: osc{1-4}_{parameter_name}
 */
export const PARAM_IDS = {
  // Oscillator 1
  OSC1_FREQUENCY: "osc1_frequency",
  OSC1_DETUNE_OCTAVE: "osc1_detune_octave",
  OSC1_DETUNE_SEMITONE: "osc1_detune_semitone",
  OSC1_DETUNE_CENT: "osc1_detune_cent",
  OSC1_VOLUME: "osc1_volume",

  // Oscillator 2
  OSC2_FREQUENCY: "osc2_frequency",
  OSC2_DETUNE_OCTAVE: "osc2_detune_octave",
  OSC2_DETUNE_SEMITONE: "osc2_detune_semitone",
  OSC2_DETUNE_CENT: "osc2_detune_cent",
  OSC2_VOLUME: "osc2_volume",

  // Oscillator 3
  OSC3_FREQUENCY: "osc3_frequency",
  OSC3_DETUNE_OCTAVE: "osc3_detune_octave",
  OSC3_DETUNE_SEMITONE: "osc3_detune_semitone",
  OSC3_DETUNE_CENT: "osc3_detune_cent",
  OSC3_VOLUME: "osc3_volume",

  // Oscillator 4
  OSC4_FREQUENCY: "osc4_frequency",
  OSC4_DETUNE_OCTAVE: "osc4_detune_octave",
  OSC4_DETUNE_SEMITONE: "osc4_detune_semitone",
  OSC4_DETUNE_CENT: "osc4_detune_cent",
  OSC4_VOLUME: "osc4_volume",

  // Filter
  FILTER_CUTOFF: "filter_cutoff",
  FILTER_RESONANCE: "filter_resonance",

  // LFOs
  LFO1_FREQUENCY: "lfo1_frequency",
  LFO2_FREQUENCY: "lfo2_frequency",
} as const;

/**
 * Helper function to get oscillator parameter ID
 * @param oscIndex - Oscillator index (0-3)
 * @param paramName - Parameter name (detune_octave, detune_semitone, detune_cent, volume)
 */
export const getOscParamId = (
  oscIndex: number,
  paramName:
    | "frequency"
    | "detune_octave"
    | "detune_semitone"
    | "detune_cent"
    | "volume"
): string => {
  return `osc${oscIndex + 1}_${paramName}`;
};

/**
 * Type-safe parameter ID type
 */
export type ParamId = (typeof PARAM_IDS)[keyof typeof PARAM_IDS];
