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

export interface SynthControlsStore {
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
  syncHarmonicsFromWaveform: (
    waveform: Float32Array | number[],
    numHarmonics: number
  ) => void;
  setHarmonics: (harmonics: HarmonicParam[]) => void;
}
