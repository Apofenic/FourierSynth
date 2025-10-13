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
import { calculateWaveform } from "../helperFunctions";

/**
 * Type definition for the AudioEngine context value
 * Provides access to Web Audio API nodes, playback state, and control methods
 */
interface AudioEngineContextType {
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
   * Update the frequency of the oscillator
   * @param freq - New frequency in Hz
   */
  const updateFrequency = useCallback((freq: number) => {
    setFrequency(freq);
    // If oscillator is currently playing, update it in real-time with minimal ramp for smooth transition
    if (oscillatorNodeRef.current && audioContextRef.current) {
      const time = audioContextRef.current.currentTime;
      // Use exponentialRampToValueAtTime for smooth, immediate frequency changes
      oscillatorNodeRef.current.frequency.exponentialRampToValueAtTime(
        freq,
        time + 0.001 // Very short ramp time (1ms) for near-instant response
      );
    }
  }, []);

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

      // Create oscillator node
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = frequency;

      // Generate and set custom waveform from Fourier series
      const calculatedWaveform = calculateWaveform(harmonics);

      // Create a custom wave table from our calculated waveform
      const waveTable = audioContext.createPeriodicWave(
        calculatedWaveform, // Real part (sine components)
        new Float32Array(calculatedWaveform.length).fill(0) // Imaginary part (cosine components)
      );

      // Connect the audio chain: oscillator -> filter1 -> filter2 -> filter3 -> filter4 -> gain -> output
      oscillatorNode.setPeriodicWave(waveTable);
      oscillatorNode.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(filter3);
      filter3.connect(filter4);
      filter4.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillatorNode.start();
      oscillatorNodeRef.current = oscillatorNode;

      return () => {
        if (oscillatorNodeRef.current) {
          oscillatorNodeRef.current.stop();
          oscillatorNodeRef.current.disconnect();
          oscillatorNodeRef.current = null;
        }
        filterNodeRef.current = null;
      };
    }
    // Only recreate audio when isPlaying changes or harmonics change
    // Frequency, cutoff, and resonance updates are handled in real-time via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, harmonics]);

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
