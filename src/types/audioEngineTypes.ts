/**
 * AudioEngine store state
 */
export interface AudioEngineState {
  // Playback state
  isPlaying: boolean;
  frequency: number;
  cutoffFrequency: number;
  resonance: number;

  // Actions
  startAudio: () => void;
  stopAudio: () => void;
  updateFrequency: (freq: number) => void;
  updateFilter: (cutoff: number, resonance: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Internal methods
  _initializeAudioContext: () => void;
  _recreateAudio: () => void;
}
