import type React from "react";

/**
 * Type definition for the AudioEngine context value
 * Provides access to Web Audio API nodes, playback state, and control methods
 */
export interface AudioEngineContextType {
  // Audio node references
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  oscillatorNodeRef: React.MutableRefObject<OscillatorNode | null>;
  gainNodeRef: React.MutableRefObject<GainNode | null>;
  filterNodeRef: React.MutableRefObject<BiquadFilterNode | null>;

  // Playback state
  isPlaying: boolean;
  frequency: number;
  cutoffFrequency: number;
  resonance: number;

  // Control methods
  startAudio: () => void;
  stopAudio: () => void;
  updateFrequency: (freq: number) => void;
  updateFilter: (cutoff: number, resonance: number) => void;
  setIsPlaying: (playing: boolean) => void;
}
