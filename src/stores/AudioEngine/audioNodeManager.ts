import { OscillatorNodeSet, LFONodeSet, LFOWaveform } from "../../types";

/**
 * External manager class for Web Audio API nodes
 * Refs are kept outside the store since they're non-serializable
 */
export class AudioNodeManager {
  audioContext: AudioContext | null = null;
  oscillators: OscillatorNodeSet[] = [];
  lfoNodes: LFONodeSet[] = [];
  mixerGainNode: GainNode | null = null;
  masterGainNode: GainNode | null = null;
  filterNodes: BiquadFilterNode[] = [];
  filterEnvelopeNode: GainNode | null = null; // For filter envelope modulation

  // Reusable buffers for analyser data (performance optimization)
  private lfoBuffers: Float32Array[];
  private oscillatorBuffers: Float32Array[]; // Buffers for oscillator output reading

  // Track envelope state for each oscillator (for modulation source extraction)
  private envelopeStates: Array<{
    stage: "idle" | "attack" | "decay" | "sustain" | "release";
    stageStartTime: number;
    attackTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
  }>;

  constructor() {
    // Initialize 4 empty oscillator slots
    this.oscillators = Array(4)
      .fill(null)
      .map(() => ({
        sourceNode: null,
        gainNode: null,
        waveformBuffer: null,
        ampEnvelopeNode: null,
        crossfadeGainNode: null,
        analyserNode: null,
      }));

    // Initialize 2 empty LFO slots
    this.lfoNodes = Array(2)
      .fill(null)
      .map(() => ({
        oscillator: null,
        gainNode: null,
        analyser: null,
      }));

    // Initialize reusable buffers for LFO reading (fftSize/2 = 64 samples)
    this.lfoBuffers = [new Float32Array(64), new Float32Array(64)];

    // Initialize reusable buffers for oscillator reading (fftSize/2 = 64 samples)
    this.oscillatorBuffers = [
      new Float32Array(64),
      new Float32Array(64),
      new Float32Array(64),
      new Float32Array(64),
    ];

    // Initialize envelope states for 4 oscillators
    this.envelopeStates = Array(4)
      .fill(null)
      .map(() => ({
        stage: "idle" as const,
        stageStartTime: 0,
        attackTime: 0,
        decayTime: 0,
        sustainLevel: 0,
        releaseTime: 0,
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
        crossfadeGainNode: null,
        analyserNode: null,
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

    // Create GainNode for crossfade control (starts at 1.0)
    const crossfadeGainNode = audioContext.createGain();
    crossfadeGainNode.gain.value = 1.0;

    // Create AnalyserNode for reading oscillator output as modulation source
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 128; // Efficient size for control-rate reading

    // Connect source -> gain -> crossfade -> envelope
    sourceNode.connect(gainNode);
    gainNode.connect(crossfadeGainNode);
    crossfadeGainNode.connect(ampEnvelopeNode);

    // Connect crossfade -> analyser (parallel connection for reading)
    crossfadeGainNode.connect(analyserNode);

    return {
      sourceNode,
      gainNode,
      waveformBuffer: buffer,
      ampEnvelopeNode,
      crossfadeGainNode,
      analyserNode,
    };
  }

  /**
   * Generic cleanup for audio nodes
   * Safely stops and disconnects nodes, suppressing errors
   */
  private cleanupNodes(...nodes: (AudioNode | null | undefined)[]): void {
    nodes.forEach((node, index) => {
      if (!node) return;

      try {
        // Stop if it's a source node (has stop method)
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        node.disconnect();
      } catch (e) {
        console.warn(`Error cleaning up node ${index}:`, e);
      }
    });
  }

  /**
   * Clean up a specific oscillator
   */
  cleanupOscillator(oscIndex: number): void {
    if (oscIndex < 0 || oscIndex >= this.oscillators.length) return;

    const osc = this.oscillators[oscIndex];
    this.cleanupNodes(
      osc.sourceNode,
      osc.gainNode,
      osc.crossfadeGainNode,
      osc.ampEnvelopeNode,
      osc.analyserNode
    );

    this.oscillators[oscIndex] = {
      sourceNode: null,
      gainNode: null,
      waveformBuffer: null,
      ampEnvelopeNode: null,
      crossfadeGainNode: null,
      analyserNode: null,
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

    // Clean up all LFOs
    for (let i = 0; i < this.lfoNodes.length; i++) {
      this.cleanupLFO(i);
    }

    // Clean up mixer, master gain, and filters
    this.cleanupNodes(
      this.mixerGainNode,
      this.masterGainNode,
      this.filterEnvelopeNode,
      ...this.filterNodes
    );

    this.mixerGainNode = null;
    this.masterGainNode = null;
    this.filterNodes = [];
    this.filterEnvelopeNode = null;
  }

  /**
   * Crossfade to a new waveform for a specific oscillator
   * Creates a new oscillator with the new waveform and smoothly transitions
   */
  crossfadeWaveform(
    oscIndex: number,
    waveformData: Float32Array,
    frequency: number,
    volume: number,
    crossfadeTimeMs: number = 30
  ): void {
    if (!this.audioContext || !this.mixerGainNode) {
      console.warn("Cannot crossfade: audio context not initialized");
      return;
    }

    const oldNodeSet = this.oscillators[oscIndex];
    if (!oldNodeSet || !oldNodeSet.sourceNode) {
      console.warn(`Cannot crossfade: oscillator ${oscIndex} not active`);
      return;
    }

    // Create new oscillator chain with new waveform
    const newNodeSet = this.createOscillatorChain(
      this.audioContext,
      waveformData,
      frequency,
      volume
    );

    if (!newNodeSet.sourceNode || !newNodeSet.crossfadeGainNode) {
      console.warn(`Failed to create new oscillator chain for ${oscIndex}`);
      return;
    }

    const time = this.audioContext.currentTime;
    const crossfadeTime = crossfadeTimeMs / 1000;

    // New oscillator starts at 0 volume and fades in
    newNodeSet.crossfadeGainNode.gain.setValueAtTime(0, time);
    newNodeSet.crossfadeGainNode.gain.linearRampToValueAtTime(
      1.0,
      time + crossfadeTime
    );

    // Copy envelope state from old to new oscillator
    if (oldNodeSet.ampEnvelopeNode && newNodeSet.ampEnvelopeNode) {
      const currentEnvValue = oldNodeSet.ampEnvelopeNode.gain.value;
      newNodeSet.ampEnvelopeNode.gain.setValueAtTime(currentEnvValue, time);
    }

    // Connect new oscillator to mixer
    newNodeSet.ampEnvelopeNode!.connect(this.mixerGainNode);

    // Start new oscillator
    newNodeSet.sourceNode.start();

    // Old oscillator fades out
    if (oldNodeSet.crossfadeGainNode) {
      oldNodeSet.crossfadeGainNode.gain.setValueAtTime(1.0, time);
      oldNodeSet.crossfadeGainNode.gain.linearRampToValueAtTime(
        0,
        time + crossfadeTime
      );
    }

    // Store new node set
    this.oscillators[oscIndex] = newNodeSet;

    // Clean up old oscillator after crossfade completes
    setTimeout(() => {
      if (oldNodeSet.sourceNode) {
        try {
          oldNodeSet.sourceNode.stop();
          oldNodeSet.sourceNode.disconnect();
        } catch (e) {
          console.warn("Error stopping old oscillator:", e);
        }
      }
      if (oldNodeSet.gainNode) {
        try {
          oldNodeSet.gainNode.disconnect();
        } catch (e) {
          console.warn("Error disconnecting old gain node:", e);
        }
      }
      if (oldNodeSet.crossfadeGainNode) {
        try {
          oldNodeSet.crossfadeGainNode.disconnect();
        } catch (e) {
          console.warn("Error disconnecting old crossfade node:", e);
        }
      }
    }, crossfadeTimeMs + 50);
  }

  /**
   * Create an LFO (Low-Frequency Oscillator) node set
   */
  createLFO(
    audioContext: AudioContext,
    frequency: number,
    waveform: LFOWaveform
  ): LFONodeSet {
    // Create OscillatorNode
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;

    // Map LFOWaveform enum to OscillatorNode waveform type
    // RANDOM will use 'sine' but we'll handle it differently later
    const waveformType =
      waveform === LFOWaveform.RANDOM ? "sine" : waveform.toLowerCase();
    oscillator.type = waveformType as OscillatorType;

    // Create GainNode (unity gain for now)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Create AnalyserNode for reading LFO values
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128; // Efficient size for control-rate reading

    // Connect: oscillator -> gain -> analyser
    oscillator.connect(gainNode);
    gainNode.connect(analyser);

    // Start oscillator
    oscillator.start();

    return {
      oscillator,
      gainNode,
      analyser,
    };
  }

  /**
   * Clean up a specific LFO
   */
  cleanupLFO(lfoIndex: number): void {
    if (lfoIndex < 0 || lfoIndex >= this.lfoNodes.length) return;

    const lfo = this.lfoNodes[lfoIndex];
    this.cleanupNodes(lfo.oscillator, lfo.gainNode, lfo.analyser);

    this.lfoNodes[lfoIndex] = {
      oscillator: null,
      gainNode: null,
      analyser: null,
    };
  }

  /**
   * Generic method to read an analyser node value
   * Uses reusable buffer to avoid allocations
   *
   * @param analyser The analyser node to read from
   * @param buffer The reusable Float32Array buffer
   * @returns Normalized value (-1 to +1), or 0 if analyser is null
   */
  private readAnalyserValue(
    analyser: AnalyserNode | null,
    buffer: Float32Array
  ): number {
    if (!analyser) return 0;

    // Read time-domain data from analyser
    // @ts-ignore - TypeScript strictness issue with Float32Array buffer types
    analyser.getFloatTimeDomainData(buffer);

    // Use the first sample as the current value
    // (could also use average, but first sample is efficient and accurate enough)
    return buffer[0]; // Already normalized to -1 to +1 range
  }

  /**
   * Read the current value of an LFO (normalized -1 to +1)
   * This method will be called by the master modulation loop (Task 5.2)
   *
   * @param lfoIndex Index of the LFO to read (0 or 1)
   * @returns Normalized LFO value (-1 to +1), or 0 if LFO is inactive
   */
  readLFOValue(lfoIndex: number): number {
    if (lfoIndex < 0 || lfoIndex >= this.lfoNodes.length) {
      console.warn(`Invalid LFO index: ${lfoIndex}`);
      return 0;
    }

    const lfo = this.lfoNodes[lfoIndex];
    if (!lfo.oscillator) return 0; // LFO not active

    return this.readAnalyserValue(lfo.analyser, this.lfoBuffers[lfoIndex]);
  }

  /**
   * Read the current value of an oscillator (normalized -1 to +1)
   * Only called when oscillator is actively used as a modulation source (lazy reading)
   * This method will be called by the master modulation loop (Task 5.2)
   *
   * @param oscIndex Index of the oscillator to read (0-3)
   * @returns Normalized oscillator value (-1 to +1), or 0 if oscillator is inactive
   */
  readOscillatorValue(oscIndex: number): number {
    if (oscIndex < 0 || oscIndex >= this.oscillators.length) {
      console.warn(`Invalid oscillator index: ${oscIndex}`);
      return 0;
    }

    const osc = this.oscillators[oscIndex];
    if (!osc.sourceNode) return 0; // Oscillator not active

    return this.readAnalyserValue(
      osc.analyserNode,
      this.oscillatorBuffers[oscIndex]
    );
  }

  /**
   * Update envelope state when a note is triggered
   * Called from triggerNoteOn in audioEngineStore
   *
   * @param oscIndex Index of the oscillator
   * @param attackTime Attack time in seconds
   * @param decayTime Decay time in seconds
   * @param sustainLevel Sustain level (0-1)
   * @param releaseTime Release time in seconds
   */
  setEnvelopeNoteOn(
    oscIndex: number,
    attackTime: number,
    decayTime: number,
    sustainLevel: number,
    releaseTime: number
  ): void {
    if (oscIndex < 0 || oscIndex >= this.envelopeStates.length) return;

    const currentTime = this.audioContext?.currentTime || 0;

    this.envelopeStates[oscIndex] = {
      stage: "attack",
      stageStartTime: currentTime,
      attackTime,
      decayTime,
      sustainLevel,
      releaseTime,
    };
  }

  /**
   * Update envelope state when a note is released
   * Called from triggerNoteOff in audioEngineStore
   *
   * @param oscIndex Index of the oscillator
   */
  setEnvelopeNoteOff(oscIndex: number): void {
    if (oscIndex < 0 || oscIndex >= this.envelopeStates.length) return;

    const currentTime = this.audioContext?.currentTime || 0;
    const state = this.envelopeStates[oscIndex];

    // Only transition to release if not already in release or idle
    if (state.stage !== "release" && state.stage !== "idle") {
      this.envelopeStates[oscIndex] = {
        ...state,
        stage: "release",
        stageStartTime: currentTime,
      };
    }
  }

  /**
   * Get the current envelope value for an oscillator (0-1 range)
   * This method calculates the envelope value based on the current time and stage
   *
   * @param oscIndex Index of the oscillator
   * @returns Current envelope amplitude (0-1), or 0 if idle
   */
  getEnvelopeValue(oscIndex: number): number {
    if (oscIndex < 0 || oscIndex >= this.envelopeStates.length) return 0;
    if (!this.audioContext) return 0;

    const state = this.envelopeStates[oscIndex];
    const currentTime = this.audioContext.currentTime;
    const elapsed = currentTime - state.stageStartTime;

    switch (state.stage) {
      case "idle":
        return 0;

      case "attack":
        if (elapsed >= state.attackTime) {
          // Transition to decay stage
          this.envelopeStates[oscIndex] = {
            ...state,
            stage: "decay",
            stageStartTime: currentTime,
          };
          return 1.0;
        }
        // Linear ramp from 0 to 1 during attack
        return elapsed / state.attackTime;

      case "decay":
        if (elapsed >= state.decayTime) {
          // Transition to sustain stage
          this.envelopeStates[oscIndex] = {
            ...state,
            stage: "sustain",
            stageStartTime: currentTime,
          };
          return state.sustainLevel;
        }
        // Linear ramp from 1 to sustain level during decay
        return 1.0 - (1.0 - state.sustainLevel) * (elapsed / state.decayTime);

      case "sustain":
        return state.sustainLevel;

      case "release":
        if (elapsed >= state.releaseTime) {
          // Release complete, go to idle
          this.envelopeStates[oscIndex] = {
            ...state,
            stage: "idle",
            stageStartTime: currentTime,
          };
          return 0;
        }
        // Linear ramp from sustain level to 0 during release
        return state.sustainLevel * (1.0 - elapsed / state.releaseTime);

      default:
        return 0;
    }
  }
}
