import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  HarmonicParam,
  OscillatorParams,
  SynthControlsStore,
} from "../types";
import { calculateWaveform } from "../utils/helperFunctions";
import { analyzeWaveformToHarmonics } from "../utils/fourierAnalysis";

/**
 * Create default oscillator parameters
 */
const createDefaultOscillator = (
  id: number,
  isActive: boolean
): OscillatorParams => {
  const harmonics: HarmonicParam[] = isActive
    ? [
        { amplitude: 1.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
      ]
    : Array(8).fill({ amplitude: 0.0, phase: 0.5 * Math.PI });

  const waveformData = calculateWaveform(harmonics);

  return {
    id,
    harmonics,
    waveformData,
    volume: 75,
    isActive,
    detune: {
      octave: 0,
      semitone: 0,
      cent: 0,
    },
  };
};

/**
 * SynthControls Store
 *
 * Manages synthesis control state including:
 * - 4 oscillators with individual harmonics and waveform data
 * - 17 keyboard notes with frequencies
 * - Active key tracking
 * - UI state (keyboard enabled, active tab)
 */
export const useSynthControlsStore = create<SynthControlsStore>()(
  devtools(
    (set) => ({
      // Initial State - 4 oscillators (all active)
      oscillators: [
        createDefaultOscillator(1, true),
        createDefaultOscillator(2, true),
        createDefaultOscillator(3, true),
        createDefaultOscillator(4, true),
      ],
      keyboardNotes: [
        { key: "a", note: "C3", frequency: 130.81, isActive: false },
        { key: "w", note: "C#3", frequency: 138.59, isActive: false },
        { key: "s", note: "D3", frequency: 146.83, isActive: false },
        { key: "e", note: "D#3", frequency: 155.56, isActive: false },
        { key: "d", note: "E3", frequency: 164.81, isActive: false },
        { key: "f", note: "F3", frequency: 174.61, isActive: false },
        { key: "t", note: "F#3", frequency: 185.0, isActive: false },
        { key: "g", note: "G3", frequency: 196.0, isActive: false },
        { key: "y", note: "G#3", frequency: 207.65, isActive: false },
        { key: "h", note: "A3", frequency: 220.0, isActive: false },
        { key: "u", note: "A#3", frequency: 233.08, isActive: false },
        { key: "j", note: "B3", frequency: 246.94, isActive: false },
        { key: "k", note: "C4", frequency: 261.63, isActive: false },
        { key: "o", note: "C#4", frequency: 277.18, isActive: false },
        { key: "l", note: "D4", frequency: 293.66, isActive: false },
        { key: "p", note: "D#4", frequency: 311.13, isActive: false },
        { key: ";", note: "E4", frequency: 329.63, isActive: false },
      ],
      activeKey: null,
      keyboardEnabled: true,
      activeTab: "equation",

      // Actions
      updateHarmonic: (oscIndex, harmonicIndex, paramType, value) =>
        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            const osc = updatedOscillators[oscIndex];
            const updatedHarmonics = [...osc.harmonics];
            updatedHarmonics[harmonicIndex] = {
              ...updatedHarmonics[harmonicIndex],
              [paramType]: value,
            };

            // Recalculate waveform for this oscillator
            const waveformData = calculateWaveform(updatedHarmonics);

            updatedOscillators[oscIndex] = {
              ...osc,
              harmonics: updatedHarmonics,
              waveformData,
            };

            return { oscillators: updatedOscillators };
          },
          false,
          "updateHarmonic"
        ),

      updateOscillatorParam: (oscIndex, param, value) =>
        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            updatedOscillators[oscIndex] = {
              ...updatedOscillators[oscIndex],
              [param]: value,
            };
            return { oscillators: updatedOscillators };
          },
          false,
          "updateOscillatorParam"
        ),

      toggleOscillator: (oscIndex, isActive) =>
        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            updatedOscillators[oscIndex] = {
              ...updatedOscillators[oscIndex],
              isActive,
            };
            return { oscillators: updatedOscillators };
          },
          false,
          "toggleOscillator"
        ),

      updateKeyboardNoteState: (key, isActive) =>
        set(
          (state) => ({
            keyboardNotes: state.keyboardNotes.map((note) =>
              note.key === key ? { ...note, isActive } : note
            ),
          }),
          false,
          "updateKeyboardNoteState"
        ),

      setActiveKey: (key) => set({ activeKey: key }, false, "setActiveKey"),

      clearActiveKey: (key) =>
        set(
          (state) => ({
            activeKey: state.activeKey === key ? null : state.activeKey,
          }),
          false,
          "clearActiveKey"
        ),

      setKeyboardEnabled: (enabled) =>
        set({ keyboardEnabled: enabled }, false, "setKeyboardEnabled"),

      setActiveTab: (tab) => set({ activeTab: tab }, false, "setActiveTab"),

      syncHarmonicsFromWaveform: (oscIndex, waveform, numHarmonics) => {
        // Analyze waveform and extract harmonic components
        const extractedHarmonics = analyzeWaveformToHarmonics(
          waveform,
          numHarmonics
        );

        // Pad with zeros if we have fewer harmonics than the fixed 8
        while (extractedHarmonics.length < 8) {
          extractedHarmonics.push({ amplitude: 0, phase: 0 });
        }

        // Trim if we extracted more than 8
        const finalHarmonics = extractedHarmonics.slice(0, 8);

        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            updatedOscillators[oscIndex] = {
              ...updatedOscillators[oscIndex],
              harmonics: finalHarmonics,
            };
            return { oscillators: updatedOscillators };
          },
          false,
          "syncHarmonicsFromWaveform"
        );
      },

      setHarmonics: (oscIndex, harmonics) =>
        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            updatedOscillators[oscIndex] = {
              ...updatedOscillators[oscIndex],
              harmonics,
            };
            return { oscillators: updatedOscillators };
          },
          false,
          "setHarmonics"
        ),

      updateDetune: (
        oscIndex: number,
        detuneType: "octave" | "semitone" | "cent",
        value: number
      ) =>
        set(
          (state) => {
            const updatedOscillators = [...state.oscillators];
            updatedOscillators[oscIndex] = {
              ...updatedOscillators[oscIndex],
              detune: {
                ...updatedOscillators[oscIndex].detune,
                [detuneType]: value,
              },
            };
            return { oscillators: updatedOscillators };
          },
          false,
          "updateDetune"
        ),
    }),
    {
      name: "SynthControls",
    }
  )
);

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
  oscIndex: number,
  state: ReturnType<typeof useSynthControlsStore.getState>
) => {
  return (
    state.oscillators[oscIndex]?.harmonics.filter(
      (h: HarmonicParam) => h.amplitude > 0
    ) || []
  );
};
