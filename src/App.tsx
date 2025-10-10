import React, { useEffect } from "react";
import "./App.css";
import {
  Typography,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { calculateWaveform } from "./helperFunctions";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import { EquationDisplay } from "./components/EquationDisplay";
import { PlainTextEquation } from "./components/PlainTextEquation";
import { HarmonicsControl } from "./components/HarmonicsControl";
import { SubtractiveControls } from "./components/SubtractiveControls";
import { KeyboardControls } from "./components/KeyboardControls";
import { useAudioEngine } from "./contexts/AudioEngineContext";
import { useSynthControls } from "./contexts/SynthControlsContext";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#61dafb",
    },
    secondary: {
      main: "#4CAF50",
    },
    background: {
      default: "#282c34",
      paper: "rgba(97, 218, 251, 0.05)",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "1.5rem",
      fontWeight: 500,
      marginBottom: "1rem",
    },
    h3: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#61dafb",
      marginBottom: "0.5rem",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(97, 218, 251, 0.05)",
          padding: "16px",
          borderRadius: "8px",
          height: "100%",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#61dafb",
          height: 8,
        },
        thumb: {
          height: 16,
          width: 16,
        },
        rail: {
          opacity: 0.5,
        },
      },
    },
  },
});

function App() {
  // Get state and refs from contexts
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

  const { harmonics, keyboardEnabled } = useSynthControls();

  // Initialize or update the audio system
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
  }, [
    isPlaying,
    frequency,
    harmonics,
    cutoffFrequency,
    resonance,
    audioContextRef,
    oscillatorNodeRef,
    gainNodeRef,
    filterNodeRef,
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container spacing={2} style={{ padding: "2rem" }}>
        {/* Header Section */}
        <Grid size={12}>
          <Typography variant="h1" align="center" gutterBottom>
            Fourier Series Synthesizer
          </Typography>
        </Grid>
        {/* body section */}
        <Grid
          container
          size={12}
          justifyContent={"center"}
          spacing={2}
          sx={{
            padding: "2rem",
          }}
        >
          {/* Waveform visualizer */}
          <Grid size={4}>
            <WaveformVisualizer />
          </Grid>
          {/* Equation Display */}
          <Grid size={4}>
            <EquationDisplay />
          </Grid>
          {/* Plain text format of the equation */}
          <Grid size={4}>
            <PlainTextEquation />
          </Grid>
          {/* Harmonics control panel */}
          <Grid size={6}>
            <HarmonicsControl />
          </Grid>
          <Grid size={6}>
            <SubtractiveControls />
          </Grid>

          {/* Visual Keyboard Component */}
          {keyboardEnabled && (
            <Grid size={12}>
              <KeyboardControls />
            </Grid>
          )}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
