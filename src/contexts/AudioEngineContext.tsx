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
