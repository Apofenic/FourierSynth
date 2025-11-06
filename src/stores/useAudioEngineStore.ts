import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEquationBuilderStore } from "./useEquationBuilderStore";
import { useSynthControlsStore } from "./useSynthControlsStore";
import {
  AudioEngineState,
  OscillatorNodeSet,
  ADSRTimes,
  EnvelopeOperation,
} from "../types";

/**
 * External manager class for Web Audio API nodes
 * Refs are kept outside the store since they're non-serializable
 */
class AudioNodeManager {
  audioContext: AudioContext | null = null;
  oscillators: OscillatorNodeSet[] = [];
  mixerGainNode: GainNode | null = null;
  masterGainNode: GainNode | null = null;
  filterNodes: BiquadFilterNode[] = [];
  filterEnvelopeNode: GainNode | null = null; // For filter envelope modulation

  constructor() {
    // Initialize 4 empty oscillator slots
    this.oscillators = Array(4)
      .fill(null)
      .map(() => ({
        sourceNode: null,
        gainNode: null,
        waveformBuffer: null,
        ampEnvelopeNode: null,
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
   * Create an oscillator chain (source + gain + envelope nodes)
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
        ampEnvelopeNode: null,
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

    // Create GainNode for ADSR envelope (starts at 0)
    const ampEnvelopeNode = audioContext.createGain();
    ampEnvelopeNode.gain.value = 0;

    // Connect source -> gain -> envelope
    sourceNode.connect(gainNode);
    gainNode.connect(ampEnvelopeNode);

    return {
      sourceNode,
      gainNode,
      waveformBuffer: buffer,
      ampEnvelopeNode,
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
      ampEnvelopeNode: null,
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

    this.filterNodes = [];

    if (this.filterEnvelopeNode) {
      try {
        this.filterEnvelopeNode.disconnect();
      } catch (e) {
        console.warn("Error disconnecting filter envelope:", e);
      }
      this.filterEnvelopeNode = null;
    }
  }
}

// Export singleton instance for external use
export const audioNodes = new AudioNodeManager();

/**
 * Convert ADSR parameters (0-100) to time values in seconds
 */
const convertADSRToTimes = (adsr: {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}): ADSRTimes => ({
  attack: 0.001 + (adsr.attack / 100) * 1.999,
  decay: 0.001 + (adsr.decay / 100) * 1.999,
  sustain: adsr.sustain / 100,
  release: 0.001 + (adsr.release / 100) * 3.999,
});

/**
 * Generate amplitude envelope operations
 */
const createAmpEnvelopeOps = (
  times: ADSRTimes,
  startTime: number,
  isNoteOn: boolean
): EnvelopeOperation[] => {
  if (isNoteOn) {
    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [0, startTime] },
      {
        method: "linearRampToValueAtTime",
        args: [1.0, startTime + times.attack],
      },
      {
        method: "linearRampToValueAtTime",
        args: [times.sustain, startTime + times.attack + times.decay],
      },
    ];
  } else {
    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [startTime] }, // Will use current value
      {
        method: "linearRampToValueAtTime",
        args: [0, startTime + times.release],
      },
    ];
  }
};

/**
 * Generate filter envelope operations
 */
const createFilterEnvelopeOps = (
  times: ADSRTimes,
  startTime: number,
  baseCutoff: number,
  envelopeAmount: number,
  isNoteOn: boolean
): EnvelopeOperation[] => {
  if (isNoteOn) {
    const maxCutoff = Math.min(20000, baseCutoff * 4);
    const targetCutoff = baseCutoff + (maxCutoff - baseCutoff) * envelopeAmount;
    const sustainCutoff =
      baseCutoff + (targetCutoff - baseCutoff) * times.sustain;

    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [baseCutoff, startTime] },
      {
        method: "exponentialRampToValueAtTime",
        args: [Math.max(20, targetCutoff), startTime + times.attack],
      },
      {
        method: "exponentialRampToValueAtTime",
        args: [
          Math.max(20, sustainCutoff),
          startTime + times.attack + times.decay,
        ],
      },
    ];
  } else {
    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [startTime] }, // Will use current value
      {
        method: "exponentialRampToValueAtTime",
        args: [Math.max(20, baseCutoff), startTime + times.release],
      },
    ];
  }
};

/**
 * Apply envelope operations to an AudioParam
 */
const applyEnvelopeOps = (
  param: AudioParam,
  operations: EnvelopeOperation[]
): void => {
  operations.forEach((op) => {
    if (op.method === "setValueAtTime" && op.args.length === 1) {
      // Special case: use current value
      param.setValueAtTime(param.value, op.args[0]);
    } else {
      (param[op.method] as any)(...op.args);
    }
  });
};

/**
 * Zustand store for AudioEngine
 * Manages Web Audio API state and operations
 */
export const useAudioEngineStore = create<AudioEngineState>()(
  devtools(
    (set, get) => ({
      // Initial state - 4 oscillators (all active)
      isPlaying: false,
      oscillators: [
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
      ],
      masterVolume: 75,
      cutoffFrequency: 2000,
      resonance: 0,
      filterEnvelopeAmount: 50, // 50% default envelope amount

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

        // Create 4-pole filter cascade with proper Q distribution
        // Using a Moog-style ladder filter approach:
        // - Equal frequency for all stages
        // - Gradually increasing Q values for stability
        // - Q scaling that prevents self-oscillation at high resonance
        const filter1 = audioContext.createBiquadFilter();
        filter1.type = "lowpass";
        filter1.frequency.value = state.cutoffFrequency;
        // Base Q: map resonance (0-20) to a more reasonable Q range (0.5-4)
        const baseQ = 0.5 + (state.resonance / 20) * 3.5;
        filter1.Q.value = baseQ * 0.7;

        const filter2 = audioContext.createBiquadFilter();
        filter2.type = "lowpass";
        filter2.frequency.value = state.cutoffFrequency;
        filter2.Q.value = baseQ * 0.85;

        const filter3 = audioContext.createBiquadFilter();
        filter3.type = "lowpass";
        filter3.frequency.value = state.cutoffFrequency;
        filter3.Q.value = baseQ * 1.0;

        const filter4 = audioContext.createBiquadFilter();
        filter4.type = "lowpass";
        filter4.frequency.value = state.cutoffFrequency;
        filter4.Q.value = baseQ * 1.15;

        // Store all filters for parameter updates
        audioNodes.filterNodes = [filter1, filter2, filter3, filter4];

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

          if (nodeSet.sourceNode && nodeSet.ampEnvelopeNode) {
            // Store node set
            audioNodes.oscillators[i] = nodeSet;

            // Connect envelope to mixer
            nodeSet.ampEnvelopeNode.connect(mixerGain);

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

        // If filters are currently active, update all 4 stages in real-time
        if (audioNodes.filterNodes.length === 4 && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;

          // Calculate base Q value using same formula as creation
          const baseQ = 0.5 + (resonance / 20) * 3.5;
          const qValues = [
            baseQ * 0.7,
            baseQ * 0.85,
            baseQ * 1.0,
            baseQ * 1.15,
          ];

          // Update all 4 filter stages
          audioNodes.filterNodes.forEach((filter, index) => {
            filter.frequency.exponentialRampToValueAtTime(
              Math.max(20, cutoff), // Clamp to min 20Hz for exponential ramp
              time + 0.01
            );
            filter.Q.linearRampToValueAtTime(qValues[index], time + 0.01);
          });
        }
      },

      /**
       * Set playing state (for external control)
       */
      setIsPlaying: (playing: boolean) => {
        set({ isPlaying: playing });
      },

      /**
       * Update filter envelope amount
       */
      updateFilterEnvelopeAmount: (amount: number) => {
        set({ filterEnvelopeAmount: amount });
      },

      /**
       * Get the maximum release time in milliseconds
       * Used to determine when it's safe to stop audio after note off
       */
      getMaxReleaseTime: (): number => {
        const synthControls = useSynthControlsStore.getState();
        const { ampADSR, filterADSR } = synthControls;

        // Convert both release times to milliseconds
        const ampRelease = (0.001 + (ampADSR.release / 100) * 3.999) * 1000;
        const filterRelease =
          (0.001 + (filterADSR.release / 100) * 3.999) * 1000;

        // Return the longer of the two, plus a small buffer
        return Math.max(ampRelease, filterRelease) + 50;
      },

      /**
       * Trigger note on - starts ADSR envelopes
       */
      triggerNoteOn: () => {
        if (!audioNodes.audioContext) return;

        const synthControls = useSynthControlsStore.getState();
        const { ampADSR, filterADSR } = synthControls;
        const state = get();
        const time = audioNodes.audioContext.currentTime;

        // Convert ADSR parameters to time values
        const ampTimes = convertADSRToTimes(ampADSR);
        const filterTimes = convertADSRToTimes(filterADSR);

        // Generate and apply amplitude envelope operations
        const ampOps = createAmpEnvelopeOps(ampTimes, time, true);
        audioNodes.oscillators
          .filter(
            (nodeSet, i) =>
              nodeSet.ampEnvelopeNode && state.oscillators[i].isActive
          )
          .forEach((nodeSet) => {
            applyEnvelopeOps(nodeSet.ampEnvelopeNode!.gain, ampOps);
          });

        // Generate and apply filter envelope operations
        if (audioNodes.filterNodes.length === 4) {
          const envelopeAmount = state.filterEnvelopeAmount / 100;
          const filterOps = createFilterEnvelopeOps(
            filterTimes,
            time,
            state.cutoffFrequency,
            envelopeAmount,
            true
          );

          audioNodes.filterNodes.forEach((filter) => {
            applyEnvelopeOps(filter.frequency, filterOps);
          });
        }
      },

      /**
       * Trigger note off - starts release phase of ADSR envelopes
       */
      triggerNoteOff: () => {
        if (!audioNodes.audioContext) return;

        const synthControls = useSynthControlsStore.getState();
        const { ampADSR, filterADSR } = synthControls;
        const state = get();
        const time = audioNodes.audioContext.currentTime;

        // Convert ADSR parameters to time values
        const ampTimes = convertADSRToTimes(ampADSR);
        const filterTimes = convertADSRToTimes(filterADSR);

        // Generate and apply amplitude release operations
        const ampOps = createAmpEnvelopeOps(ampTimes, time, false);
        audioNodes.oscillators
          .filter(
            (nodeSet, i) =>
              nodeSet.ampEnvelopeNode && state.oscillators[i].isActive
          )
          .forEach((nodeSet) => {
            applyEnvelopeOps(nodeSet.ampEnvelopeNode!.gain, ampOps);
          });

        // Generate and apply filter release operations
        if (audioNodes.filterNodes.length === 4) {
          const filterOps = createFilterEnvelopeOps(
            filterTimes,
            time,
            state.cutoffFrequency,
            0, // Envelope amount doesn't matter for release
            false
          );

          audioNodes.filterNodes.forEach((filter) => {
            applyEnvelopeOps(filter.frequency, filterOps);
          });
        }
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
  if (audioEngineState.isPlaying) {
    // Check if any oscillator's waveform data changed
    const waveformChanged = state.oscillators.some(
      (osc, index) =>
        osc.waveformData !== prevState.oscillators[index].waveformData
    );
    if (waveformChanged) {
      audioEngineState._recreateAudio();
    }
  }
});

// Subscribe to oscillator changes to recreate audio
useSynthControlsStore.subscribe((state, prevState) => {
  const audioEngineState = useAudioEngineStore.getState();
  if (
    audioEngineState.isPlaying &&
    state.oscillators !== prevState.oscillators
  ) {
    // Check if detune changed for any oscillator
    const detuneChanged = state.oscillators.some(
      (osc, index) =>
        osc.detune.octave !== prevState.oscillators[index].detune.octave ||
        osc.detune.semitone !== prevState.oscillators[index].detune.semitone ||
        osc.detune.cent !== prevState.oscillators[index].detune.cent
    );

    if (detuneChanged) {
      // Re-apply current frequency with new detune values
      const activeNote = state.keyboardNotes.find(
        (note) => note.key === state.activeKey
      );
      if (activeNote) {
        // Import the helper function inline
        const calculateDetunedFrequency = (
          baseFrequency: number,
          octave: number,
          semitone: number,
          cent: number
        ): number => {
          const totalSemitones = octave * 12 + semitone + cent / 100;
          return baseFrequency * Math.pow(2, totalSemitones / 12);
        };

        state.oscillators.forEach((osc, index) => {
          if (audioEngineState.oscillators[index].isActive) {
            const detunedFreq = calculateDetunedFrequency(
              activeNote.frequency,
              osc.detune.octave,
              osc.detune.semitone,
              osc.detune.cent
            );
            audioEngineState.updateOscillatorFrequency(index, detunedFreq);
          }
        });
      }
    } else {
      audioEngineState._recreateAudio();
    }
  }
});

// Initialize audio context on module load
audioNodes.initializeAudioContext();
