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

    // Connect source -> gain -> crossfade -> envelope
    sourceNode.connect(gainNode);
    gainNode.connect(crossfadeGainNode);
    crossfadeGainNode.connect(ampEnvelopeNode);

    return {
      sourceNode,
      gainNode,
      waveformBuffer: buffer,
      ampEnvelopeNode,
      crossfadeGainNode,
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
      crossfadeGainNode: null,
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
    if (lfo.oscillator) {
      try {
        lfo.oscillator.stop();
        lfo.oscillator.disconnect();
      } catch (e) {
        console.warn(`Error stopping LFO ${lfoIndex}:`, e);
      }
    }
    if (lfo.gainNode) {
      try {
        lfo.gainNode.disconnect();
      } catch (e) {
        console.warn(`Error disconnecting LFO gain node ${lfoIndex}:`, e);
      }
    }
    if (lfo.analyser) {
      try {
        lfo.analyser.disconnect();
      } catch (e) {
        console.warn(`Error disconnecting LFO analyser ${lfoIndex}:`, e);
      }
    }

    this.lfoNodes[lfoIndex] = {
      oscillator: null,
      gainNode: null,
      analyser: null,
    };
  }

  /**
   * Read the current value of an LFO (normalized -1 to +1)
   * Uses reusable buffer to avoid allocations
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
    if (!lfo.analyser || !lfo.oscillator) {
      // LFO not active, return 0
      return 0;
    }

    // Get the reusable buffer for this LFO
    const buffer = this.lfoBuffers[lfoIndex];

    // Read time-domain data from analyser
    // @ts-ignore - TypeScript strictness issue with Float32Array buffer types
    lfo.analyser.getFloatTimeDomainData(buffer);

    // Use the first sample as the current value
    // (could also use average, but first sample is efficient and accurate enough)
    const value = buffer[0];

    // Value is already normalized to -1 to +1 range by the analyser
    return value;
  }
}
