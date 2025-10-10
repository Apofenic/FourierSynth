import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import { calculateWaveform } from "../helperFunctions";

/**
 * Interface for harmonic parameters (amplitude and phase)
 */
export interface HarmonicParam {
  amplitude: number;
  phase: number;
}

/**
 * Interface for keyboard note mapping
 */
export interface KeyboardNote {
  key: string;
  note: string;
  frequency: number;
  isActive: boolean;
}

/**
 * Type definition for the SynthControls context value
 * Provides access to synthesis parameters, keyboard state, and waveform data
 */
interface SynthControlsContextType {
  // Harmonics state
  harmonics: HarmonicParam[];
  updateHarmonic: (
    index: number,
    paramType: "amplitude" | "phase",
    value: number
  ) => void;

  // Keyboard state
  keyboardNotes: KeyboardNote[];
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  clearActiveKey: (key: string) => void;
  updateKeyboardNoteState: (key: string, isActive: boolean) => void;

  // Waveform data for visualization
  waveformData: Float32Array;

  // Keyboard enabled state
  keyboardEnabled: boolean;
  setKeyboardEnabled: (enabled: boolean) => void;
}

/**
 * Context for managing synthesis controls and parameters
 */
const SynthControlsContext = createContext<
  SynthControlsContextType | undefined
>(undefined);

/**
 * Provider component for SynthControls context
 * Manages harmonics, keyboard state, and waveform generation
 */
export const SynthControlsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Harmonics state - default to sine wave (first harmonic only)
  const [harmonics, setHarmonics] = useState<HarmonicParam[]>([
    { amplitude: 1.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
  ]);

  // Keyboard state
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [keyboardNotes, setKeyboardNotes] = useState<KeyboardNote[]>([
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
  ]);

  // Waveform data for visualization
  const [waveformData, setWaveformData] = useState<Float32Array>(
    new Float32Array(2048).fill(0)
  );

  /**
   * Update a single harmonic parameter (amplitude or phase)
   * @param index - Index of the harmonic to update (0-based)
   * @param paramType - Type of parameter ("amplitude" or "phase")
   * @param value - New value for the parameter
   */
  const updateHarmonic = useCallback(
    (index: number, paramType: "amplitude" | "phase", value: number) => {
      setHarmonics((prevHarmonics) => {
        const updatedHarmonics = [...prevHarmonics];
        updatedHarmonics[index] = {
          ...updatedHarmonics[index],
          [paramType]: value,
        };
        return updatedHarmonics;
      });
    },
    []
  );

  /**
   * Update the active state of a keyboard note
   * @param key - The keyboard key
   * @param isActive - Whether the key is currently active
   */
  const updateKeyboardNoteState = useCallback((key: string, isActive: boolean) => {
    setKeyboardNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.key === key ? { ...note, isActive } : note
      )
    );
  }, []);

  /**
   * Clear the active key (set to null)
   * @param key - The key to clear (validates it's the current active key)
   */
  const clearActiveKey = useCallback(
    (key: string) => {
      setActiveKey((currentKey) => (currentKey === key ? null : currentKey));
    },
    []
  );

  /**
   * Recalculate waveform whenever harmonics change
   */
  useEffect(() => {
    const calculatedWaveform = calculateWaveform(harmonics);
    setWaveformData(calculatedWaveform);
  }, [harmonics]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      harmonics,
      updateHarmonic,
      keyboardNotes,
      activeKey,
      setActiveKey,
      clearActiveKey,
      updateKeyboardNoteState,
      waveformData,
      keyboardEnabled,
      setKeyboardEnabled,
    }),
    [
      harmonics,
      updateHarmonic,
      keyboardNotes,
      activeKey,
      clearActiveKey,
      updateKeyboardNoteState,
      waveformData,
      keyboardEnabled,
    ]
  );

  return (
    <SynthControlsContext.Provider value={contextValue}>
      {children}
    </SynthControlsContext.Provider>
  );
};

/**
 * Custom hook to access SynthControls context
 * @throws Error if used outside of SynthControlsProvider
 */
export const useSynthControls = (): SynthControlsContextType => {
  const context = useContext(SynthControlsContext);
  if (!context) {
    throw new Error(
      "useSynthControls must be used within SynthControlsProvider"
    );
  }
  return context;
};
