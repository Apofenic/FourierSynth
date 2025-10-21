
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
export interface SynthControlsContextType {
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

  // Tab state for UI navigation (equation builder vs harmonic controls)
  activeTab: 'equation' | 'harmonic';
  setActiveTab: (tab: 'equation' | 'harmonic') => void;
}
