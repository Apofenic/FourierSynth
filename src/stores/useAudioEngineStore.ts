import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEquationBuilderStore } from "./useEquationBuilderStore";
import { useSynthControlsStore } from "./useSynthControlsStore";

/**
 * External manager class for Web Audio API nodes
 * Refs are kept outside the store since they're non-serializable
 */
class AudioNodeManager {
  audioContext: AudioContext | null = null;
  oscillatorNode: OscillatorNode | null = null;
  gainNode: GainNode | null = null;
  filterNode: BiquadFilterNode | null = null;

  /**
   * Initialize audio context if not already created
   */
  initializeAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Clean up all audio nodes
   */
  cleanup(): void {
    if (this.oscillatorNode) {
      try {
        this.oscillatorNode.stop();
        this.oscillatorNode.disconnect();
      } catch (e) {
        console.warn("Error stopping oscillator:", e);
      }
      this.oscillatorNode = null;
    }
    this.filterNode = null;
    this.gainNode = null;
  }
}

// Export singleton instance for external use
export const audioNodes = new AudioNodeManager();

/**
 * AudioEngine store state
 */
interface AudioEngineState {
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

/**
 * Zustand store for AudioEngine
 * Manages Web Audio API state and operations
 */
export const useAudioEngineStore = create<AudioEngineState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      frequency: 220,
      cutoffFrequency: 2000,
      resonance: 0,

      /**
       * Initialize audio context (called on mount)
       */
      _initializeAudioContext: () => {
        audioNodes.initializeAudioContext();
      },

      /**
       * Start audio playback
       */
      startAudio: () => {
        audioNodes.initializeAudioContext();
        set({ isPlaying: true });
        get()._recreateAudio();
      },

      /**
       * Stop audio playback and cleanup
       */
      stopAudio: () => {
        audioNodes.cleanup();
        set({ isPlaying: false });
      },

      /**
       * Update frequency in real-time
       */
      updateFrequency: (freq: number) => {
        set({ frequency: freq });

        // If source is currently playing, update playback rate in real-time
        if (audioNodes.oscillatorNode && audioNodes.audioContext) {
          const sourceNode = audioNodes.oscillatorNode as any;
          const waveformData = useEquationBuilderStore.getState().waveformData;
          const waveformLength = waveformData.length || 2048;
          const baseCycleFrequency =
            audioNodes.audioContext.sampleRate / waveformLength;
          const time = audioNodes.audioContext.currentTime;

          // Update playback rate to match new frequency
          if (sourceNode.playbackRate) {
            sourceNode.playbackRate.exponentialRampToValueAtTime(
              freq / baseCycleFrequency,
              time + 0.001
            );
          }
        }
      },

      /**
       * Update filter parameters in real-time
       */
      updateFilter: (cutoff: number, resonance: number) => {
        set({ cutoffFrequency: cutoff, resonance: resonance });

        // If filter is currently active, update it in real-time
        if (audioNodes.filterNode && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          // Apply slight smoothing to avoid clicks
          audioNodes.filterNode.frequency.exponentialRampToValueAtTime(
            cutoff,
            time + 0.01
          );
          audioNodes.filterNode.Q.linearRampToValueAtTime(
            resonance,
            time + 0.01
          );
        }
      },

      /**
       * Set playing state (for external control)
       */
      setIsPlaying: (playing: boolean) => {
        set({ isPlaying: playing });
      },

      /**
       * Recreate audio chain (internal method)
       * Called when isPlaying, harmonics, or waveformData changes
       */
      _recreateAudio: () => {
        const state = get();
        if (!state.isPlaying) return;

        // Get dependencies from other stores
        const waveformData = useEquationBuilderStore.getState().waveformData;
        const harmonics = useSynthControlsStore.getState().harmonics;

        // Check if waveformData has data
        if (!waveformData || waveformData.length === 0) {
          console.warn("Cannot create audio: waveformData is empty");
          return;
        }

        // Initialize audio context if needed
        if (!audioNodes.audioContext) {
          audioNodes.audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        const audioContext = audioNodes.audioContext;

        // Cleanup existing nodes
        audioNodes.cleanup();

        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5;
        audioNodes.gainNode = gainNode;

        // Create 4-pole filter (four cascaded 2nd-order filters)
        const filter1 = audioContext.createBiquadFilter();
        filter1.type = "lowpass";
        filter1.frequency.value = state.cutoffFrequency;
        filter1.Q.value = state.resonance;

        const filter2 = audioContext.createBiquadFilter();
        filter2.type = "lowpass";
        filter2.frequency.value = state.cutoffFrequency;
        filter2.Q.value = state.resonance * 0.7;

        const filter3 = audioContext.createBiquadFilter();
        filter3.type = "lowpass";
        filter3.frequency.value = state.cutoffFrequency;
        filter3.Q.value = state.resonance * 0.4;

        const filter4 = audioContext.createBiquadFilter();
        filter4.type = "lowpass";
        filter4.frequency.value = state.cutoffFrequency;
        filter4.Q.value = state.resonance * 0.2;

        // Store the first filter for parameter updates
        audioNodes.filterNode = filter1;

        // Create audio buffer source node
        const sourceNode = audioContext.createBufferSource();

        // Convert waveformData to Float32Array
        const calculatedWaveform = new Float32Array(waveformData);

        // Create AudioBuffer
        const buffer = audioContext.createBuffer(
          1, // mono
          calculatedWaveform.length,
          audioContext.sampleRate
        );

        // Copy waveform data
        buffer.copyToChannel(calculatedWaveform, 0);

        // Set buffer and enable looping
        sourceNode.buffer = buffer;
        sourceNode.loop = true;

        // Adjust playback rate to match frequency
        const baseCycleFrequency =
          audioContext.sampleRate / calculatedWaveform.length;
        sourceNode.playbackRate.value = state.frequency / baseCycleFrequency;

        // Connect audio chain: source -> filters -> gain -> output
        sourceNode.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(filter4);
        filter4.connect(gainNode);
        gainNode.connect(audioContext.destination);

        sourceNode.start();
        audioNodes.oscillatorNode = sourceNode as any;
      },
    }),
    { name: "AudioEngine" }
  )
);

// Subscribe to waveformData changes to recreate audio
useEquationBuilderStore.subscribe((state, prevState) => {
  const audioEngineState = useAudioEngineStore.getState();
  if (
    audioEngineState.isPlaying &&
    state.waveformData !== prevState.waveformData
  ) {
    audioEngineState._recreateAudio();
  }
});

// Subscribe to harmonics changes to recreate audio
useSynthControlsStore.subscribe((state, prevState) => {
  const audioEngineState = useAudioEngineStore.getState();
  if (audioEngineState.isPlaying && state.harmonics !== prevState.harmonics) {
    audioEngineState._recreateAudio();
  }
});

// Initialize audio context on module load
audioNodes.initializeAudioContext();
