/**
 * Interface for harmonic parameters (amplitude and phase)
 */
export interface HarmonicParam {
  amplitude: number;
  phase: number;
}

/**
 * Interface for per-oscillator parameters (UI state)
 */
export interface OscillatorParams {
  id: number; // 1-4
  harmonics: HarmonicParam[];
  waveformData: Float32Array;
  volume: number; // 0-100 range for UI
  isActive: boolean;
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

export interface SynthControlsStore {
  // State
  oscillators: OscillatorParams[];
  keyboardNotes: KeyboardNote[];
  activeKey: string | null;
  keyboardEnabled: boolean;
  activeTab: "equation" | "harmonic";
  // Actions
  updateHarmonic: (
    oscIndex: number,
    harmonicIndex: number,
    paramType: "amplitude" | "phase",
    value: number
  ) => void;
  updateOscillatorParam: (
    oscIndex: number,
    param: keyof OscillatorParams,
    value: any
  ) => void;
  toggleOscillator: (oscIndex: number, isActive: boolean) => void;
  updateKeyboardNoteState: (key: string, isActive: boolean) => void;
  setActiveKey: (key: string | null) => void;
  clearActiveKey: (key: string) => void;
  setKeyboardEnabled: (enabled: boolean) => void;
  setActiveTab: (tab: "equation" | "harmonic") => void;
  syncHarmonicsFromWaveform: (
    oscIndex: number,
    waveform: Float32Array | number[],
    numHarmonics: number
  ) => void;
  setHarmonics: (oscIndex: number, harmonics: HarmonicParam[]) => void;
}
