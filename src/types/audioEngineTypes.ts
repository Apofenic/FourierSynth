/**
 * Represents a single oscillator's audio nodes
 */
export interface OscillatorNodeSet {
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  waveformBuffer: AudioBuffer | null;
  ampEnvelopeNode: GainNode | null;
  crossfadeGainNode: GainNode | null; // For smooth waveform transitions
}

/**
 * Represents a single oscillator's state in the store
 */
export interface OscillatorState {
  frequency: number;
  volume: number; // 0-1 range for audio
  isActive: boolean;
}

/**
 * AudioEngine store state
 */
export interface AudioEngineState {
  // Playback state
  isPlaying: boolean;
  isNoteHeld: boolean; // Track if a note is currently being held
  oscillators: OscillatorState[];
  masterVolume: number; // 0-100 range
  cutoffFrequency: number;
  resonance: number;
  filterEnvelopeAmount: number; // 0-100 range for filter envelope depth

  // Actions
  startAudio: () => void;
  stopAudio: () => void;
  updateOscillatorFrequency: (oscIndex: number, freq: number) => void;
  updateOscillatorVolume: (oscIndex: number, volume: number) => void;
  updateMasterVolume: (volume: number) => void;
  toggleOscillator: (oscIndex: number, isActive: boolean) => void;
  updateFilter: (cutoff: number, resonance: number) => void;
  updateFilterEnvelopeAmount: (amount: number) => void;
  setIsPlaying: (playing: boolean) => void;
  triggerNoteOn: () => void;
  triggerNoteOff: () => void;
  getMaxReleaseTime: () => number;

  // Internal methods
  _initializeAudioContext: () => void;
  _recreateAudio: () => void;
}
/**
 * ADSR Envelope Helper Types and Functions
 */
export interface EnvelopeOperation {
  method:
    | "cancelScheduledValues"
    | "setValueAtTime"
    | "linearRampToValueAtTime"
    | "exponentialRampToValueAtTime";
  args: number[];
}

export interface ADSRTimes {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}
