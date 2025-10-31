/**
 * Represents a single oscillator's audio nodes
 */
export interface OscillatorNodeSet {
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  waveformBuffer: AudioBuffer | null;
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
  oscillators: OscillatorState[];
  masterVolume: number; // 0-100 range
  cutoffFrequency: number;
  resonance: number;

  // Actions
  startAudio: () => void;
  stopAudio: () => void;
  updateOscillatorFrequency: (oscIndex: number, freq: number) => void;
  updateOscillatorVolume: (oscIndex: number, volume: number) => void;
  updateMasterVolume: (volume: number) => void;
  toggleOscillator: (oscIndex: number, isActive: boolean) => void;
  updateFilter: (cutoff: number, resonance: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Internal methods
  _initializeAudioContext: () => void;
  _recreateAudio: () => void;
}
