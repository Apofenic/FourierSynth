import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { calculateWaveform, calculateWaveformFromExpression } from "../utils/helperFunctions";
import { useEquationBuilder } from "./EquationBuilderContext";
import type {
  HarmonicParam,
  KeyboardNote,
  SynthControlsContextType,
} from "../types/synthControlsTypes";

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

  // Tab state for UI navigation (equation builder vs harmonic controls)
  const [activeTab, setActiveTab] = useState<'equation' | 'harmonic'>('equation');

  // Waveform data for visualization
  const [waveformData, setWaveformData] = useState<Float32Array>(
    new Float32Array(2048).fill(0)
  );

  // Access equation builder context for hybrid waveform generation
  const equationBuilder = useEquationBuilder();

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
  const updateKeyboardNoteState = useCallback(
    (key: string, isActive: boolean) => {
      setKeyboardNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.key === key ? { ...note, isActive } : note
        )
      );
    },
    []
  );

  /**
   * Clear the active key (set to null)
   * @param key - The key to clear (validates it's the current active key)
   */
  const clearActiveKey = useCallback((key: string) => {
    setActiveKey((currentKey) => (currentKey === key ? null : currentKey));
  }, []);

  /**
   * Recalculate waveform using hybrid approach:
   * - Equation builder provides base layer (if valid)
   * - Harmonics add partials on top
   * - Both contribute to final waveform simultaneously
   */
  useEffect(() => {
    // Generate base layer from equation (if equation exists and is valid)
    let baseWaveform: number[] = [];
    if (equationBuilder.compiledFunction && equationBuilder.validationResult.isValid) {
      baseWaveform = calculateWaveformFromExpression(
        equationBuilder.compiledFunction,
        equationBuilder.variables,
        2048
      );
    }
    
    // Generate harmonic layer (additive partials)
    const harmonicWaveform = calculateWaveform(harmonics);
    
    // Combine layers: base + harmonics
    const combinedWaveform = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const base = baseWaveform[i] || 0;
      const harmonic = harmonicWaveform[i] || 0;
      combinedWaveform[i] = base + harmonic;
    }
    
    // Normalize combined waveform to prevent clipping
    const maxAmplitude = Math.max(...Array.from(combinedWaveform).map(Math.abs));
    if (maxAmplitude > 1e-10) {
      for (let i = 0; i < combinedWaveform.length; i++) {
        combinedWaveform[i] /= maxAmplitude;
      }
    }
    
    setWaveformData(combinedWaveform);
  }, [harmonics, equationBuilder.compiledFunction, equationBuilder.variables, equationBuilder.validationResult.isValid]);

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
      activeTab,
      setActiveTab,
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
      activeTab,
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
