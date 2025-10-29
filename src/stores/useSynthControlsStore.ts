import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { HarmonicParam, KeyboardNote } from "../types/synthControlsTypes";

/**
 * SynthControlsStore State Interface
 * Manages synthesis controls, harmonics, keyboard state, and waveform generation
 */
interface SynthControlsStore {
  // State
  harmonics: HarmonicParam[];
  keyboardNotes: KeyboardNote[];
  activeKey: string | null;
  waveformData: Float32Array;
  keyboardEnabled: boolean;
  activeTab: "equation" | "harmonic";

  // Actions
  updateHarmonic: (
    index: number,
    paramType: "amplitude" | "phase",
    value: number
  ) => void;
  updateKeyboardNoteState: (key: string, isActive: boolean) => void;
  setActiveKey: (key: string | null) => void;
  clearActiveKey: (key: string) => void;
  setWaveformData: (data: Float32Array) => void;
  setKeyboardEnabled: (enabled: boolean) => void;
  setActiveTab: (tab: "equation" | "harmonic") => void;
}

/**
 * SynthControls Store
 *
 * Manages synthesis control state including:
 * - 8 harmonics with amplitude and phase
 * - 17 keyboard notes with frequencies
 * - Active key tracking
 * - Waveform data for visualization
 * - UI state (keyboard enabled, active tab)
 */
export const useSynthControlsStore = create<SynthControlsStore>()(
  devtools(
    (set) => ({
      // Initial State
      harmonics: [
        { amplitude: 1.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
        { amplitude: 0.0, phase: 0.5 * Math.PI },
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
      waveformData: new Float32Array(2048).fill(0),
      keyboardEnabled: true,
      activeTab: "equation",

      // Actions
      updateHarmonic: (index, paramType, value) =>
        set(
          (state) => {
            const updatedHarmonics = [...state.harmonics];
            updatedHarmonics[index] = {
              ...updatedHarmonics[index],
              [paramType]: value,
            };
            return { harmonics: updatedHarmonics };
          },
          false,
          "updateHarmonic"
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

      setWaveformData: (data) =>
        set({ waveformData: data }, false, "setWaveformData"),

      setKeyboardEnabled: (enabled) =>
        set({ keyboardEnabled: enabled }, false, "setKeyboardEnabled"),

      setActiveTab: (tab) => set({ activeTab: tab }, false, "setActiveTab"),
    }),
    {
      name: "SynthControls",
    }
  )
);
