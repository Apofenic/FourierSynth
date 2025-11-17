import { useModulationStore } from "../useModulationStore";
import { audioNodes } from "./audioEngineStore";
import { ParameterMetadata } from "../../types";

/**
 * Parameter Registry
 *
 * This file contains helper functions for registering parameters
 * with the modulation system. Each parameter gets metadata including
 * min/max values, type (linear/exponential), and an update function.
 */

/**
 * Register an oscillator parameter with the modulation system
 *
 * @param oscIndex - Oscillator index (0-3)
 * @param paramName - Parameter name (frequency, detune_octave, detune_semitone, detune_cent, volume)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param defaultValue - Default value
 * @param type - Parameter type (linear or exponential)
 * @param updateFn - Function to update the Web Audio API parameter
 */
export const registerOscillatorParam = (
  oscIndex: number,
  paramName: string,
  min: number,
  max: number,
  defaultValue: number,
  type: "linear" | "exponential",
  updateFn: (value: number) => void
) => {
  const paramId = `osc${oscIndex + 1}_${paramName}`;

  const metadata: ParameterMetadata = {
    paramId,
    min,
    max,
    default: defaultValue,
    type,
    updateFn,
  };

  useModulationStore.getState().registerParameter(metadata);
};

/**
 * Register a filter parameter with the modulation system
 *
 * @param paramName - Parameter name (cutoff, resonance)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param defaultValue - Default value
 * @param type - Parameter type (linear or exponential)
 * @param updateFn - Function to update the Web Audio API parameter
 */
export const registerFilterParam = (
  paramName: string,
  min: number,
  max: number,
  defaultValue: number,
  type: "linear" | "exponential",
  updateFn: (value: number) => void
) => {
  const paramId = `filter_${paramName}`;

  const metadata: ParameterMetadata = {
    paramId,
    min,
    max,
    default: defaultValue,
    type,
    updateFn,
  };

  useModulationStore.getState().registerParameter(metadata);
};

/**
 * Register an ADSR parameter with the modulation system
 *
 * @param oscIndex - Oscillator index (0-3)
 * @param stage - ADSR stage (attack, decay, sustain, release)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param defaultValue - Default value
 * @param updateFn - Function to update the parameter
 */
export const registerADSRParam = (
  oscIndex: number,
  stage: "attack" | "decay" | "sustain" | "release",
  min: number,
  max: number,
  defaultValue: number,
  updateFn: (value: number) => void
) => {
  const paramId = `osc${oscIndex + 1}_adsr_${stage}`;

  const metadata: ParameterMetadata = {
    paramId,
    min,
    max,
    default: defaultValue,
    type: "linear", // ADSR parameters are always linear
    updateFn,
  };

  useModulationStore.getState().registerParameter(metadata);
};

/**
 * Register an LFO parameter with the modulation system
 *
 * @param lfoIndex - LFO index (0-1)
 * @param paramName - Parameter name (frequency, depth)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param defaultValue - Default value
 * @param type - Parameter type (linear or exponential)
 * @param updateFn - Function to update the parameter
 */
export const registerLFOParam = (
  lfoIndex: number,
  paramName: string,
  min: number,
  max: number,
  defaultValue: number,
  type: "linear" | "exponential",
  updateFn: (value: number) => void
) => {
  const paramId = `lfo${lfoIndex + 1}_${paramName}`;

  const metadata: ParameterMetadata = {
    paramId,
    min,
    max,
    default: defaultValue,
    type,
    updateFn,
  };

  useModulationStore.getState().registerParameter(metadata);
};

/**
 * Register all modulatable parameters with the modulation system
 * This should be called once during audio engine initialization
 */
export const registerAllParameters = () => {
  // Register oscillator parameters (4 oscillators)
  for (let i = 0; i < 4; i++) {
    // Oscillator frequency (exponential, 20-20000 Hz)
    registerOscillatorParam(
      i,
      "frequency",
      20,
      20000,
      220,
      "exponential",
      (value: number) => {
        const nodeSet = audioNodes.oscillators[i];
        if (nodeSet && nodeSet.sourceNode && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          // Audio-rate parameter: 1ms ramp to prevent zipper noise
          // Note: This is a simplified version - actual implementation
          // needs to calculate playback rate based on waveform buffer
          nodeSet.sourceNode.playbackRate.exponentialRampToValueAtTime(
            Math.max(0.001, value / 220), // Prevent zero for exponential
            time + 0.001 // 1ms ramp
          );
        }
      }
    );

    // Oscillator detune - octave (linear, -2 to +2)
    registerOscillatorParam(
      i,
      "detune_octave",
      -2,
      2,
      0,
      "linear",
      (value: number) => {
        // Detune handled by frequency calculation in synthControls
        // This is a placeholder for when we implement direct modulation
      }
    );

    // Oscillator detune - semitone (linear, -12 to +12)
    registerOscillatorParam(
      i,
      "detune_semitone",
      -12,
      12,
      0,
      "linear",
      (value: number) => {
        // Detune handled by frequency calculation in synthControls
      }
    );

    // Oscillator detune - cent (linear, -100 to +100)
    registerOscillatorParam(
      i,
      "detune_cent",
      -100,
      100,
      0,
      "linear",
      (value: number) => {
        // Detune handled by frequency calculation in synthControls
      }
    );

    // Oscillator volume (linear, 0 to 1)
    registerOscillatorParam(i, "volume", 0, 1, 1, "linear", (value: number) => {
      const nodeSet = audioNodes.oscillators[i];
      if (nodeSet && nodeSet.gainNode && audioNodes.audioContext) {
        const time = audioNodes.audioContext.currentTime;
        // Volume parameter: 10ms linear ramp for smooth transitions
        nodeSet.gainNode.gain.linearRampToValueAtTime(value, time + 0.01);
      }
    });
  }

  // Register filter parameters
  // Filter cutoff (exponential, 20-20000 Hz)
  registerFilterParam(
    "cutoff",
    20,
    20000,
    632,
    "exponential",
    (value: number) => {
      if (audioNodes.filterNodes.length === 4 && audioNodes.audioContext) {
        const time = audioNodes.audioContext.currentTime;
        // Filter frequency: 10ms exponential ramp for smooth, musical sweeps
        audioNodes.filterNodes.forEach((filter) => {
          filter.frequency.exponentialRampToValueAtTime(
            Math.max(20, value), // Prevent zero for exponential
            time + 0.01 // 10ms ramp
          );
        });
      }
    }
  );

  // Filter resonance (linear, 0-30)
  registerFilterParam("resonance", 0, 30, 0, "linear", (value: number) => {
    if (audioNodes.filterNodes.length === 4 && audioNodes.audioContext) {
      const time = audioNodes.audioContext.currentTime;
      // Calculate Q values using same formula as filter creation
      const baseQ = 0.5 + (value / 20) * 3.5;
      const qValues = [baseQ * 0.7, baseQ * 0.85, baseQ * 1.0, baseQ * 1.15];
      // Filter Q: 10ms linear ramp for smooth resonance changes
      audioNodes.filterNodes.forEach((filter, index) => {
        filter.Q.linearRampToValueAtTime(qValues[index], time + 0.01); // 10ms ramp
      });
    }
  });

  // Register LFO parameters (2 LFOs)
  for (let i = 0; i < 2; i++) {
    // LFO frequency (exponential, 0.01-20 Hz)
    registerLFOParam(
      i,
      "frequency",
      0.01,
      20,
      i === 0 ? 1.0 : 2.0,
      "exponential",
      (value: number) => {
        const lfoNodes = audioNodes.lfoNodes[i];
        if (lfoNodes && lfoNodes.oscillator && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          // Control-rate parameter: use setValueAtTime for immediate update
          // LFO frequency changes don't need ramping as they're slow modulation sources
          lfoNodes.oscillator.frequency.setValueAtTime(
            Math.max(0.01, value), // Prevent zero for exponential
            time
          );
        }
      }
    );
  }

  // Note: ADSR parameters are typically not modulated in real-time
  // as they define envelope shapes rather than continuous values.
  // If needed, they can be registered similarly to the above.
};
