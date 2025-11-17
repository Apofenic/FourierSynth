import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Settings store state interface
 */
interface SettingsState {
  bufferSize: number;
  oversample: OverSampleType;

  // Actions
  setBufferSize: (size: number) => void;
  setOversample: (oversample: OverSampleType) => void;
}

/**
 * Settings Store
 *
 * Manages application-wide settings with persistence to localStorage
 */
export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        bufferSize: 2048,
        oversample: "none" as OverSampleType,

        // Actions
        setBufferSize: (size: number) => {
          set({ bufferSize: size });
        },
        setOversample: (oversample: OverSampleType) => {
          set({ oversample });
        },
      }),
      {
        name: "fourier-synth-settings",
      }
    ),
    { name: "Settings" }
  )
);

// Selectors
export const selectBufferSize = (state: SettingsState) => state.bufferSize;
export const selectOversample = (state: SettingsState) => state.oversample;
