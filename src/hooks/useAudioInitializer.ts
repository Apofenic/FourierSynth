import { useEffect } from "react";
import { useAudioEngine } from "../contexts/AudioEngineContext";
import { useSynthControls } from "../contexts/SynthControlsContext";
import { calculateWaveform } from "../helperFunctions";

/**
 * Custom hook to manage audio initialization and harmonics-based oscillator creation
 * 
 * This hook handles the complete Web Audio API setup including:
 * - Creating and connecting an oscillator with a custom waveform generated from Fourier series
 * - Building a 4-pole lowpass filter by cascading four BiquadFilters (24dB/octave rolloff)
 * - Setting up gain node for volume control
 * - Managing audio node lifecycle (creation and cleanup)
 * 
 * The oscillator is recreated whenever:
 * - `isPlaying` state changes (start/stop playback)
 * - `harmonics` array changes (different waveform shape)
 * 
 * Real-time parameter updates (frequency, filter cutoff, resonance) are handled
 * via the AudioEngine context methods and do not trigger oscillator recreation.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useAudioInitializer(); // Initialize and manage audio system
 *   return <YourComponents />;
 * }
 * ```
 */
export const useAudioInitializer = () => {
  const {
    audioContextRef,
    oscillatorNodeRef,
    gainNodeRef,
    filterNodeRef,
    isPlaying,
    frequency,
    cutoffFrequency,
    resonance,
  } = useAudioEngine();

  const { harmonics } = useSynthControls();

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
};
