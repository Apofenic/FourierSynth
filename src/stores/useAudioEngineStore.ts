import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEquationBuilderStore } from "./useEquationBuilderStore";
import { useSynthControlsStore } from "./useSynthControlsStore";
import { AudioEngineState, OscillatorNodeSet } from "../types";

/**
 * External manager class for Web Audio API nodes
 * Refs are kept outside the store since they're non-serializable
 */
class AudioNodeManager {
  audioContext: AudioContext | null = null;
  oscillators: OscillatorNodeSet[] = [];
  mixerGainNode: GainNode | null = null;
  masterGainNode: GainNode | null = null;
  filterNode: BiquadFilterNode | null = null;

  constructor() {
    // Initialize 4 empty oscillator slots
    this.oscillators = Array(4)
      .fill(null)
      .map(() => ({
        sourceNode: null,
        gainNode: null,
        waveformBuffer: null,
      }));
  }

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
   * Create an oscillator chain (source + gain node)
   */
  createOscillatorChain(
    audioContext: AudioContext,
    waveformData: Float32Array,
    frequency: number,
    volume: number
  ): OscillatorNodeSet {
    // Validate waveformData
    if (!waveformData || waveformData.length === 0) {
      console.warn("Cannot create oscillator: waveformData is empty");
      return {
        sourceNode: null,
        gainNode: null,
        waveformBuffer: null,
      };
    }

    // Create AudioBuffer
    const buffer = audioContext.createBuffer(
      1, // mono
      waveformData.length,
      audioContext.sampleRate
    );
    // Copy waveform data - create new Float32Array to ensure proper type
    const bufferData = new Float32Array(waveformData);
    buffer.copyToChannel(bufferData, 0);

    // Create BufferSourceNode
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;

    // Calculate playback rate for frequency control
    const baseCycleFrequency = audioContext.sampleRate / waveformData.length;
    sourceNode.playbackRate.value = frequency / baseCycleFrequency;

    // Create GainNode for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Connect source -> gain
    sourceNode.connect(gainNode);

    return {
      sourceNode,
      gainNode,
      waveformBuffer: buffer,
    };
  }

  /**
   * Clean up a specific oscillator
   */
  cleanupOscillator(oscIndex: number): void {
    if (oscIndex < 0 || oscIndex >= this.oscillators.length) return;

    const osc = this.oscillators[oscIndex];
    if (osc.sourceNode) {
      try {
        osc.sourceNode.stop();
        osc.sourceNode.disconnect();
      } catch (e) {
        console.warn(`Error stopping oscillator ${oscIndex}:`, e);
      }
    }
    if (osc.gainNode) {
      try {
        osc.gainNode.disconnect();
      } catch (e) {
        console.warn(`Error disconnecting gain node ${oscIndex}:`, e);
      }
    }

    this.oscillators[oscIndex] = {
      sourceNode: null,
      gainNode: null,
      waveformBuffer: null,
    };
  }

  /**
   * Clean up all audio nodes
   */
  cleanup(): void {
    // Clean up all oscillators
    for (let i = 0; i < this.oscillators.length; i++) {
      this.cleanupOscillator(i);
    }

    // Clean up mixer and master gain
    if (this.mixerGainNode) {
      try {
        this.mixerGainNode.disconnect();
      } catch (e) {
        console.warn("Error disconnecting mixer:", e);
      }
      this.mixerGainNode = null;
    }

    if (this.masterGainNode) {
      try {
        this.masterGainNode.disconnect();
      } catch (e) {
        console.warn("Error disconnecting master gain:", e);
      }
      this.masterGainNode = null;
    }

    this.filterNode = null;
  }
}

// Export singleton instance for external use
export const audioNodes = new AudioNodeManager();

/**
 * Zustand store for AudioEngine
 * Manages Web Audio API state and operations
 */
export const useAudioEngineStore = create<AudioEngineState>()(
  devtools(
    (set, get) => ({
      // Initial state - 4 oscillators
      isPlaying: false,
      oscillators: [
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: false },
        { frequency: 220, volume: 0.75, isActive: false },
        { frequency: 220, volume: 0.75, isActive: false },
      ],
      masterVolume: 75,
      cutoffFrequency: 2000,
      resonance: 0,

      /**
       * Initialize audio context (called on mount)
       */
      _initializeAudioContext: () => {
        audioNodes.initializeAudioContext();
      },

      /**
       * Recreate audio chain (internal method)
       * Called when isPlaying, harmonics, or waveformData changes
       */
      _recreateAudio: () => {
        const state = get();
        if (!state.isPlaying) return;

        // Get dependencies from SynthControls store
        const synthControls = useSynthControlsStore.getState();

        // Initialize audio context if needed
        if (!audioNodes.audioContext) {
          audioNodes.audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        const audioContext = audioNodes.audioContext;

        // Cleanup existing nodes
        audioNodes.cleanup();

        // Create mixer gain node (unity gain, oscillators control mix)
        const mixerGain = audioContext.createGain();
        mixerGain.gain.value = 1.0;
        audioNodes.mixerGainNode = mixerGain;

        // Create master gain node
        const masterGain = audioContext.createGain();
        masterGain.gain.value = state.masterVolume / 100;
        audioNodes.masterGainNode = masterGain;

        // Create 4-pole filter cascade
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

        // Store first filter for parameter updates
        audioNodes.filterNode = filter1;

        // Create oscillator chains for all active oscillators
        for (let i = 0; i < state.oscillators.length; i++) {
          const oscState = state.oscillators[i];
          if (!oscState.isActive) continue;

          const oscParams = synthControls.oscillators[i];
          if (
            !oscParams ||
            !oscParams.waveformData ||
            oscParams.waveformData.length === 0
          ) {
            console.warn(`Oscillator ${i}: no waveform data available`);
            continue;
          }

          // Create oscillator chain
          const nodeSet = audioNodes.createOscillatorChain(
            audioContext,
            oscParams.waveformData,
            oscState.frequency,
            oscState.volume
          );

          if (nodeSet.sourceNode && nodeSet.gainNode) {
            // Store node set
            audioNodes.oscillators[i] = nodeSet;

            // Connect to mixer
            nodeSet.gainNode.connect(mixerGain);

            // Start playback
            nodeSet.sourceNode.start();
          }
        }

        // Connect audio graph: mixer -> filter cascade -> master -> output
        mixerGain.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(filter4);
        filter4.connect(masterGain);
        masterGain.connect(audioContext.destination);
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
       * Update frequency for a specific oscillator in real-time
       */
      updateOscillatorFrequency: (oscIndex: number, freq: number) => {
        set((state) => ({
          oscillators: state.oscillators.map((osc, i) =>
            i === oscIndex ? { ...osc, frequency: freq } : osc
          ),
        }));

        // If oscillator is currently playing, update playback rate in real-time
        const nodeSet = audioNodes.oscillators[oscIndex];
        if (nodeSet && nodeSet.sourceNode && audioNodes.audioContext) {
          const synthControls = useSynthControlsStore.getState();
          const oscParams = synthControls.oscillators[oscIndex];
          if (oscParams && oscParams.waveformData) {
            const baseCycleFrequency =
              audioNodes.audioContext.sampleRate /
              oscParams.waveformData.length;
            const time = audioNodes.audioContext.currentTime;

            nodeSet.sourceNode.playbackRate.exponentialRampToValueAtTime(
              freq / baseCycleFrequency,
              time + 0.001
            );
          }
        }
      },

      /**
       * Update volume for a specific oscillator in real-time
       */
      updateOscillatorVolume: (oscIndex: number, volume: number) => {
        set((state) => ({
          oscillators: state.oscillators.map((osc, i) =>
            i === oscIndex ? { ...osc, volume } : osc
          ),
        }));

        // If oscillator is currently playing, update gain in real-time
        const nodeSet = audioNodes.oscillators[oscIndex];
        if (nodeSet && nodeSet.gainNode && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          nodeSet.gainNode.gain.linearRampToValueAtTime(volume, time + 0.01);
        }
      },

      /**
       * Update master volume in real-time
       */
      updateMasterVolume: (volume: number) => {
        set({ masterVolume: volume });

        // If master gain is active, update it in real-time
        if (audioNodes.masterGainNode && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          audioNodes.masterGainNode.gain.linearRampToValueAtTime(
            volume / 100,
            time + 0.01
          );
        }
      },

      /**
       * Toggle oscillator on/off with smooth fade
       */
      toggleOscillator: (oscIndex: number, isActive: boolean) => {
        set((state) => ({
          oscillators: state.oscillators.map((osc, i) =>
            i === oscIndex ? { ...osc, isActive } : osc
          ),
        }));

        if (!get().isPlaying) return;

        if (isActive) {
          // Enable oscillator: create and start
          const state = get();
          const synthControls = useSynthControlsStore.getState();
          const oscParams = synthControls.oscillators[oscIndex];
          const oscState = state.oscillators[oscIndex];

          if (
            !oscParams ||
            !oscParams.waveformData ||
            oscParams.waveformData.length === 0
          ) {
            console.warn(
              `Cannot enable oscillator ${oscIndex}: no waveform data`
            );
            return;
          }

          if (!audioNodes.audioContext || !audioNodes.mixerGainNode) {
            console.warn(
              `Cannot enable oscillator ${oscIndex}: audio context not initialized`
            );
            return;
          }

          // Create oscillator chain
          const nodeSet = audioNodes.createOscillatorChain(
            audioNodes.audioContext,
            oscParams.waveformData,
            oscState.frequency,
            oscState.volume
          );

          if (nodeSet.sourceNode && nodeSet.gainNode) {
            audioNodes.oscillators[oscIndex] = nodeSet;
            nodeSet.gainNode.connect(audioNodes.mixerGainNode);
            nodeSet.sourceNode.start();
          }
        } else {
          // Disable oscillator: fade out and stop
          const nodeSet = audioNodes.oscillators[oscIndex];
          if (nodeSet && nodeSet.gainNode && audioNodes.audioContext) {
            const time = audioNodes.audioContext.currentTime;
            nodeSet.gainNode.gain.exponentialRampToValueAtTime(
              0.001,
              time + 0.05
            );

            // Stop and cleanup after fade
            setTimeout(() => {
              audioNodes.cleanupOscillator(oscIndex);
            }, 60);
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
    }),
    { name: "AudioEngine" }
  )
);

// AudioEngine selectors
export const selectIsPlaying = (
  state: ReturnType<typeof useAudioEngineStore.getState>
) => {
  return state.isPlaying;
};

export const selectAudioParameters = (
  state: ReturnType<typeof useAudioEngineStore.getState>
) => {
  return {
    oscillators: state.oscillators,
    masterVolume: state.masterVolume,
    cutoffFrequency: state.cutoffFrequency,
    resonance: state.resonance,
  };
};

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

// Subscribe to oscillator changes to recreate audio
useSynthControlsStore.subscribe((state, prevState) => {
  const audioEngineState = useAudioEngineStore.getState();
  if (
    audioEngineState.isPlaying &&
    state.oscillators !== prevState.oscillators
  ) {
    audioEngineState._recreateAudio();
  }
});

// Initialize audio context on module load
audioNodes.initializeAudioContext();
