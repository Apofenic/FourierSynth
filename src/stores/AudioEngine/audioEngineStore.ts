import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEquationBuilderStore } from "../useEquationBuilderStore";
import { useSynthControlsStore } from "../useSynthControlsStore";
import { useModulationStore } from "../useModulationStore";
import {
  AudioEngineState,
  ADSRTimes,
  EnvelopeOperation,
  LFOWaveform,
  ModulationSource,
} from "../../types";
import { AudioNodeManager } from "./audioNodeManager";
import {
  convertADSRToTimes,
  createAmpEnvelopeOps,
  createFilterEnvelopeOps,
  applyEnvelopeOps,
} from "./helperFunctions";
import { registerAllParameters } from "./parameterRegistry";

// Export singleton instance for external use
export const audioNodes = new AudioNodeManager();

// Master modulation loop control
let masterModulationLoopId: number | null = null;

/**
 * Master Modulation Update Loop
 * Consolidated requestAnimationFrame loop that:
 * 1. Reads all modulation sources (LFOs, envelopes, oscillators)
 * 2. Updates modulation store with source values
 * 3. Applies modulations to all registered parameters
 *
 * This is the ONLY modulation update loop in the system.
 * Performance target: <10ms per frame with full modulation matrix
 */
const masterModulationLoop = () => {
  // Performance monitoring (dev mode)
  const frameStartTime = performance.now();

  // Get modulation store
  const modStore = useModulationStore.getState();
  const activeSources = modStore.getActiveSources();

  // Skip if no active modulation routes
  if (activeSources.size === 0) {
    masterModulationLoopId = requestAnimationFrame(masterModulationLoop);
    return;
  }

  // ==========================================
  // PHASE 1: Read all modulation sources
  // ==========================================

  // Read LFO values (always read if active, regardless of routing)
  if (activeSources.has(ModulationSource.LFO1)) {
    const lfo1Value = audioNodes.readLFOValue(0);
    modStore.updateSourceValue(ModulationSource.LFO1, lfo1Value);
  }

  if (activeSources.has(ModulationSource.LFO2)) {
    const lfo2Value = audioNodes.readLFOValue(1);
    modStore.updateSourceValue(ModulationSource.LFO2, lfo2Value);
  }

  // Read envelope values (modulation envelope)
  // Use the dedicated modulation envelope from SynthControls
  if (activeSources.has(ModulationSource.MOD_ENV)) {
    const envValue = audioNodes.getModEnvelopeValue();
    // Normalize from 0-1 to -1 to +1 for consistency with other mod sources
    const normalizedEnvValue = envValue * 2 - 1;
    modStore.updateSourceValue(ModulationSource.MOD_ENV, normalizedEnvValue);
  }

  // Read oscillator values (LAZY - only if actively routed)
  for (let i = 0; i < 4; i++) {
    const oscSource = [
      ModulationSource.OSC1,
      ModulationSource.OSC2,
      ModulationSource.OSC3,
      ModulationSource.OSC4,
    ][i];

    if (activeSources.has(oscSource)) {
      const oscValue = audioNodes.readOscillatorValue(i);
      modStore.updateSourceValue(oscSource, oscValue);
    }
  }

  // ==========================================
  // PHASE 2: Apply modulations to parameters
  // ==========================================

  // Get all registered parameters
  const registeredParams = modStore.parameters;
  const synthState = useSynthControlsStore.getState();
  const engineState = useAudioEngineStore.getState();

  // Iterate through all registered parameters and apply modulation
  Object.entries(registeredParams).forEach(([paramId, metadata]) => {
    // Get base value from state
    let baseValue = metadata.default; // Fallback to default

    // Get current base value from stores based on parameter ID
    if (paramId.startsWith("osc")) {
      const oscMatch = paramId.match(/^osc(\d+)_(.+)$/);
      if (oscMatch) {
        const oscIndex = parseInt(oscMatch[1]) - 1;
        const paramName = oscMatch[2];

        if (paramName === "frequency") {
          baseValue = engineState.oscillators[oscIndex].frequency;
        } else if (paramName === "volume") {
          baseValue = engineState.oscillators[oscIndex].volume;
        } else if (paramName.startsWith("detune_")) {
          // Detune values come from synthControls
          const synthOsc = synthState.oscillators[oscIndex];
          const detuneType = paramName.replace("detune_", "") as
            | "octave"
            | "semitone"
            | "cent";
          baseValue = synthOsc.detune[detuneType];
        }
      }
    } else if (paramId.startsWith("filter_")) {
      const paramName = paramId.replace("filter_", "");
      if (paramName === "cutoff") baseValue = engineState.cutoffFrequency;
      else if (paramName === "resonance") baseValue = engineState.resonance;
    } else if (paramId.startsWith("lfo")) {
      const lfoMatch = paramId.match(/^lfo(\d+)_(.+)$/);
      if (lfoMatch) {
        const lfoIndex = parseInt(lfoMatch[1]) - 1;
        const paramName = lfoMatch[2];

        if (paramName === "frequency")
          baseValue = engineState.lfos[lfoIndex].frequency;
      }
    }

    // Calculate modulated value (this handles all routing, scaling, clamping)
    const modulatedValue = modStore.getModulatedValue(paramId, baseValue);

    // Apply modulated value using the parameter's update function
    metadata.updateFn(modulatedValue);
  });

  // Performance monitoring
  const frameTime = performance.now() - frameStartTime;
  if (frameTime > 14) {
    console.warn(
      `Modulation loop exceeded 14ms: ${frameTime.toFixed(2)}ms (target: <10ms)`
    );
  }

  // Continue loop
  masterModulationLoopId = requestAnimationFrame(masterModulationLoop);
};

/**
 * Start the master modulation loop
 */
const startMasterModulationLoop = () => {
  if (masterModulationLoopId !== null) return; // Already running
  masterModulationLoopId = requestAnimationFrame(masterModulationLoop);
};

/**
 * Stop the master modulation loop
 */
const stopMasterModulationLoop = () => {
  if (masterModulationLoopId !== null) {
    cancelAnimationFrame(masterModulationLoopId);
    masterModulationLoopId = null;
  }
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
      isNoteHeld: false,
      oscillators: [
        { frequency: 220, volume: 1.0, isActive: true },
        { frequency: 220, volume: 1.0, isActive: true },
        { frequency: 220, volume: 1.0, isActive: true },
        { frequency: 220, volume: 1.0, isActive: true },
      ],
      lfos: [
        {
          frequency: 1.0, // 1 Hz default
          waveform: LFOWaveform.SINE,
          phase: 0,
          isActive: false,
        },
        {
          frequency: 2.0, // 2 Hz default
          waveform: LFOWaveform.TRIANGLE,
          phase: 0,
          isActive: false,
        },
      ],
      masterVolume: 100,
      cutoffFrequency: 632,
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
        // Start master modulation loop
        startMasterModulationLoop();
      },

      /**
       * Stop audio playback and cleanup
       */
      stopAudio: () => {
        // Stop master modulation loop
        stopMasterModulationLoop();
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

        // Mark that a note is being held
        set({ isNoteHeld: true });

        const synthControls = useSynthControlsStore.getState();
        const { ampADSR, filterADSR, modADSR, ampEnvelopeAmount } =
          synthControls;
        const state = get();
        const time = audioNodes.audioContext.currentTime;

        // Convert ADSR parameters to time values
        const ampTimes = convertADSRToTimes(ampADSR);
        const filterTimes = convertADSRToTimes(filterADSR);
        const modTimes = convertADSRToTimes(modADSR);

        // Convert amp envelope amount from 0-100 to 0-1 range
        const envelopeAmount = ampEnvelopeAmount / 100;

        // Update envelope state tracking for modulation (per oscillator)
        for (let i = 0; i < state.oscillators.length; i++) {
          if (state.oscillators[i].isActive) {
            audioNodes.setEnvelopeNoteOn(
              i,
              ampTimes.attack,
              ampTimes.decay,
              ampTimes.sustain,
              ampTimes.release
            );
          }
        }

        // Update modulation envelope state tracking
        audioNodes.setModEnvelopeNoteOn(
          modTimes.attack,
          modTimes.decay,
          modTimes.sustain,
          modTimes.release
        );

        // Generate and apply amplitude envelope operations
        const ampOps = createAmpEnvelopeOps(
          ampTimes,
          time,
          true,
          envelopeAmount
        );
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
          const filterEnvelopeAmount = state.filterEnvelopeAmount / 100;
          const filterOps = createFilterEnvelopeOps(
            filterTimes,
            time,
            state.cutoffFrequency,
            filterEnvelopeAmount,
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

        // Mark that note is no longer being held
        set({ isNoteHeld: false });

        const synthControls = useSynthControlsStore.getState();
        const { ampADSR, filterADSR, ampEnvelopeAmount } = synthControls;
        const state = get();
        const time = audioNodes.audioContext.currentTime;

        // Update envelope state tracking for modulation (per oscillator)
        for (let i = 0; i < state.oscillators.length; i++) {
          if (state.oscillators[i].isActive) {
            audioNodes.setEnvelopeNoteOff(i);
          }
        }

        // Update modulation envelope state tracking
        audioNodes.setModEnvelopeNoteOff();

        // Convert ADSR parameters to time values
        const ampTimes = convertADSRToTimes(ampADSR);
        const filterTimes = convertADSRToTimes(filterADSR);

        // Convert amp envelope amount from 0-100 to 0-1 range
        const envelopeAmount = ampEnvelopeAmount / 100;

        // Generate and apply amplitude release operations
        const ampOps = createAmpEnvelopeOps(
          ampTimes,
          time,
          false,
          envelopeAmount
        );
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

      /**
       * Update LFO frequency in real-time
       */
      updateLFOFrequency: (lfoIndex: number, frequency: number) => {
        set((state) => ({
          lfos: state.lfos.map((lfo, i) =>
            i === lfoIndex ? { ...lfo, frequency } : lfo
          ),
        }));

        // If LFO is currently playing, update oscillator frequency in real-time
        const lfoNodes = audioNodes.lfoNodes[lfoIndex];
        if (lfoNodes && lfoNodes.oscillator && audioNodes.audioContext) {
          const time = audioNodes.audioContext.currentTime;
          lfoNodes.oscillator.frequency.setValueAtTime(frequency, time);
        }
      },

      /**
       * Update LFO waveform by recreating the oscillator
       */
      updateLFOWaveform: (lfoIndex: number, waveform: LFOWaveform) => {
        const state = get();
        const currentLFO = state.lfos[lfoIndex];

        set((prevState) => ({
          lfos: prevState.lfos.map((lfo, i) =>
            i === lfoIndex ? { ...lfo, waveform } : lfo
          ),
        }));

        // If LFO is currently playing, recreate it with new waveform
        if (currentLFO.isActive && audioNodes.audioContext) {
          audioNodes.cleanupLFO(lfoIndex);
          const lfoNodes = audioNodes.createLFO(
            audioNodes.audioContext,
            currentLFO.frequency,
            waveform
          );
          audioNodes.lfoNodes[lfoIndex] = lfoNodes;
        }
      },

      /**
       * Toggle LFO on/off
       */
      toggleLFO: (lfoIndex: number, isActive: boolean) => {
        set((state) => ({
          lfos: state.lfos.map((lfo, i) =>
            i === lfoIndex ? { ...lfo, isActive } : lfo
          ),
        }));

        if (!audioNodes.audioContext) {
          audioNodes.initializeAudioContext();
        }

        const state = get();
        const lfo = state.lfos[lfoIndex];

        if (isActive) {
          // Enable LFO: create and start nodes
          if (audioNodes.audioContext) {
            const lfoNodes = audioNodes.createLFO(
              audioNodes.audioContext,
              lfo.frequency,
              lfo.waveform
            );
            audioNodes.lfoNodes[lfoIndex] = lfoNodes;
          }
        } else {
          // Disable LFO: cleanup nodes
          audioNodes.cleanupLFO(lfoIndex);
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
    // Check which oscillators had waveform changes
    const changedOscillators = state.oscillators
      .map((osc, index) => ({
        index,
        changed: osc.waveformData !== prevState.oscillators[index].waveformData,
        waveformData: osc.waveformData,
      }))
      .filter((osc) => osc.changed && osc.waveformData.length > 0);

    if (changedOscillators.length > 0) {
      if (audioEngineState.isNoteHeld) {
        // Note is being held: use crossfade for smooth transition
        const synthControls = useSynthControlsStore.getState();

        changedOscillators.forEach(({ index, waveformData }) => {
          const oscState = audioEngineState.oscillators[index];
          const oscParams = synthControls.oscillators[index];

          if (oscState.isActive && oscParams?.waveformData) {
            // Convert waveformData to Float32Array if needed
            const waveformFloat32 =
              waveformData instanceof Float32Array
                ? waveformData
                : new Float32Array(waveformData);

            audioNodes.crossfadeWaveform(
              index,
              waveformFloat32,
              oscState.frequency,
              oscState.volume,
              30 // 30ms crossfade
            );
          }
        });
      } else {
        // No note held: recreate audio (existing behavior)
        audioEngineState._recreateAudio();
      }
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
      // Only recreate if no note is currently being held
      if (!audioEngineState.isNoteHeld) {
        audioEngineState._recreateAudio();
      }
      // If a note is being held, changes will take effect on next note trigger
    }
  }
});

// Initialize audio context on module load
audioNodes.initializeAudioContext();

// Register all modulatable parameters
registerAllParameters();
