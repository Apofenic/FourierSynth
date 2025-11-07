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
  detune: {
    octave: number; // -3 to +3
    semitone: number; // -12 to +12
    cent: number; // -100 to +100
  };
}

/**
 * Interface for ADSR envelope parameters
 */
export interface ADSRParams {
  attack: number; // 0-100 (will be mapped to seconds)
  decay: number; // 0-100 (will be mapped to seconds)
  sustain: number; // 0-100 (sustain level as percentage)
  release: number; // 0-100 (will be mapped to seconds)
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
  ampADSR: ADSRParams;
  filterADSR: ADSRParams;
  modADSR: ADSRParams;
  ampEnvelopeAmount: number; // 0-100 (percentage of envelope effect)
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
  updateDetune: (
    oscIndex: number,
    detuneType: "octave" | "semitone" | "cent",
    value: number
  ) => void;
  updateAmpADSR: (param: keyof ADSRParams, value: number) => void;
  updateFilterADSR: (param: keyof ADSRParams, value: number) => void;
  updateModADSR: (param: keyof ADSRParams, value: number) => void;
  setAmpEnvelopeAmount: (amount: number) => void;
}
