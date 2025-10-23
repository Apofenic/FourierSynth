import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useSynthControls } from "./SynthControlsContext";
import { useEquationBuilder } from "./EquationBuilderContext";
import { calculateWaveform } from "../utils/helperFunctions";
import type { AudioEngineContextType } from "../types";

/**
 * Context for managing Web Audio API state and operations
 */
const AudioEngineContext = createContext<AudioEngineContextType | undefined>(
  undefined
);

/**
 * Provider component for AudioEngine context
 * Manages all audio-related state and Web Audio API interactions
 */
export const AudioEngineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get harmonics from SynthControlsContext
  const { waveformData } = useEquationBuilder();
  const { harmonics } = useSynthControls();

  // Audio node refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(220);
  const [cutoffFrequency, setCutoffFrequency] = useState(2000);
  const [resonance, setResonance] = useState(0);

  /**
   * Initialize audio context if not already created
   */
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Start audio playback
   * This is a placeholder - actual oscillator start logic will be handled
   * by the component consuming harmonics data
   */
  const startAudio = useCallback(() => {
    initializeAudioContext();
    setIsPlaying(true);
  }, [initializeAudioContext]);

  /**
   * Stop audio playback and cleanup audio nodes
   */
  const stopAudio = useCallback(() => {
    if (oscillatorNodeRef.current) {
      try {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
      } catch (e) {
        // Oscillator may already be stopped
        console.warn("Error stopping oscillator:", e);
      }
      oscillatorNodeRef.current = null;
    }
    filterNodeRef.current = null;
    gainNodeRef.current = null;
    setIsPlaying(false);
  }, []);

  /**
   * Update the frequency of the audio source
   * @param freq - New frequency in Hz
   */
  const updateFrequency = useCallback(
    (freq: number) => {
      setFrequency(freq);
      // If source is currently playing, update playback rate in real-time
      if (oscillatorNodeRef.current && audioContextRef.current) {
        const sourceNode = oscillatorNodeRef.current as any;
        const waveformLength = waveformData.length || 2048;
        const baseCycleFrequency =
          audioContextRef.current.sampleRate / waveformLength;
        const time = audioContextRef.current.currentTime;

        // Update playback rate to match new frequency
        if (sourceNode.playbackRate) {
          sourceNode.playbackRate.exponentialRampToValueAtTime(
            freq / baseCycleFrequency,
            time + 0.001
          );
        }
      }
    },
    [waveformData.length]
  );

  /**
   * Update filter parameters in real-time
   * @param cutoff - Cutoff frequency in Hz
   * @param resonance - Q factor (resonance)
   */
  const updateFilter = useCallback((cutoff: number, resonance: number) => {
    setCutoffFrequency(cutoff);
    setResonance(resonance);

    // If filter is currently active, update it in real-time
    if (filterNodeRef.current && audioContextRef.current) {
      const time = audioContextRef.current.currentTime;
      // Apply slight smoothing to avoid clicks
      filterNodeRef.current.frequency.exponentialRampToValueAtTime(
        cutoff,
        time + 0.01
      );
      filterNodeRef.current.Q.linearRampToValueAtTime(resonance, time + 0.01);
    }
  }, []);

  // Initialize audio context on mount to reduce first-note latency
  useEffect(() => {
    initializeAudioContext();
  }, [initializeAudioContext]);

  // Initialize or update the audio system when playing state or harmonics change
  useEffect(() => {
    if (isPlaying) {
      // Create new audio context if not already created
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5; // Set initial volume
      gainNodeRef.current = gainNode;

      // Create 4-pole filter (four cascaded 2nd-order filters to simulate a 4-pole filter)
      // First BiquadFilter
      const filter1 = audioContext.createBiquadFilter();
      filter1.type = "lowpass";
      filter1.frequency.value = cutoffFrequency;
      filter1.Q.value = resonance;

      // Second BiquadFilter to cascade (creating a 4-pole/24dB per octave filter)
      const filter2 = audioContext.createBiquadFilter();
      filter2.type = "lowpass";
      filter2.frequency.value = cutoffFrequency;
      filter2.Q.value = resonance * 0.7; // Slightly reduce resonance on subsequent filters

      // Third BiquadFilter
      const filter3 = audioContext.createBiquadFilter();
      filter3.type = "lowpass";
      filter3.frequency.value = cutoffFrequency;
      filter3.Q.value = resonance * 0.4;

      // Fourth BiquadFilter
      const filter4 = audioContext.createBiquadFilter();
      filter4.type = "lowpass";
      filter4.frequency.value = cutoffFrequency;
      filter4.Q.value = resonance * 0.2;

      // Store the first filter for parameter updates
      filterNodeRef.current = filter1;

      // Create audio buffer source node for custom waveform playback
      const sourceNode = audioContext.createBufferSource();

      console.log("Creating audio source with waveform data:", waveformData);

      // Convert waveformData to Float32Array if needed
      const calculatedWaveform = new Float32Array(waveformData);

      // Create an AudioBuffer to hold our custom waveform
      const buffer = audioContext.createBuffer(
        1, // mono channel
        calculatedWaveform.length,
        audioContext.sampleRate
      );

      // Copy waveform data into the buffer
      buffer.copyToChannel(calculatedWaveform, 0);

      // Set the buffer and enable looping for continuous playback
      sourceNode.buffer = buffer;
      sourceNode.loop = true;

      // Adjust playback rate to match desired frequency
      // The buffer represents one cycle, so playback rate = frequency / base frequency
      const baseCycleFrequency =
        audioContext.sampleRate / calculatedWaveform.length;
      sourceNode.playbackRate.value = frequency / baseCycleFrequency;

      // Connect the audio chain: source -> filter1 -> filter2 -> filter3 -> filter4 -> gain -> output
      sourceNode.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(filter3);
      filter3.connect(filter4);
      filter4.connect(gainNode);
      gainNode.connect(audioContext.destination);

      sourceNode.start();
      oscillatorNodeRef.current = sourceNode as any; // Store as oscillator ref for compatibility

      return () => {
        if (oscillatorNodeRef.current) {
          try {
            oscillatorNodeRef.current.stop();
            oscillatorNodeRef.current.disconnect();
          } catch (e) {
            console.warn("Error stopping source node:", e);
          }
          oscillatorNodeRef.current = null;
        }
        filterNodeRef.current = null;
      };
    }
    // Recreate audio when playing state, harmonics, or waveformData changes
    // Frequency, cutoff, and resonance updates are handled in real-time via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, harmonics, waveformData]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      audioContextRef,
      oscillatorNodeRef,
      gainNodeRef,
      filterNodeRef,
      isPlaying,
      frequency,
      cutoffFrequency,
      resonance,
      startAudio,
      stopAudio,
      updateFrequency,
      updateFilter,
      setIsPlaying,
    }),
    [
      isPlaying,
      frequency,
      cutoffFrequency,
      resonance,
      startAudio,
      stopAudio,
      updateFrequency,
      updateFilter,
    ]
  );

  return (
    <AudioEngineContext.Provider value={contextValue}>
      {children}
    </AudioEngineContext.Provider>
  );
};

/**
 * Custom hook to access AudioEngine context
 * @throws Error if used outside of AudioEngineProvider
 */
export const useAudioEngine = (): AudioEngineContextType => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return context;
};
