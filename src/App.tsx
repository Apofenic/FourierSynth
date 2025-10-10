import React, { useState, useEffect, useRef } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./App.css";
import {
  Typography,
  Slider,
  Box,
  Paper,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  calculateWaveform,
  generateFourierEquation,
  generateFullEquation,
} from "./helperFunctions";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));
interface HarmonicParam {
  amplitude: number;
  phase: number;
}

interface KeyboardNote {
  key: string;
  note: string;
  frequency: number;
  isActive: boolean;
}

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(220);
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(0);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [keyboardNotes, setKeyboardNotes] = useState<KeyboardNote[]>([
    { key: "a", note: "C3", frequency: 130.81, isActive: false },
    { key: "w", note: "C#3", frequency: 138.59, isActive: false },
    { key: "s", note: "D3", frequency: 146.83, isActive: false },
    { key: "e", note: "D#3", frequency: 155.56, isActive: false },
    { key: "d", note: "E3", frequency: 164.81, isActive: false },
    { key: "f", note: "F3", frequency: 174.61, isActive: false },
    { key: "t", note: "F#3", frequency: 185.0, isActive: false },
    { key: "g", note: "G3", frequency: 196.0, isActive: false },
    { key: "y", note: "G#3", frequency: 207.65, isActive: false },
    { key: "h", note: "A3", frequency: 220.0, isActive: false },
    { key: "u", note: "A#3", frequency: 233.08, isActive: false },
    { key: "j", note: "B3", frequency: 246.94, isActive: false },
    { key: "k", note: "C4", frequency: 261.63, isActive: false },
    { key: "o", note: "C#4", frequency: 277.18, isActive: false },
    { key: "l", note: "D4", frequency: 293.66, isActive: false },
    { key: "p", note: "D#4", frequency: 311.13, isActive: false },
    { key: ";", note: "E4", frequency: 329.63, isActive: false },
  ]);
  const [harmonics, setHarmonics] = useState<HarmonicParam[]>([
    { amplitude: 1.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
    { amplitude: 0.0, phase: 0.5 * Math.PI },
  ]);
  // Custom waveform array (will store Fourier series output)
  const [waveform, setWaveform] = useState<Float32Array>(
    new Float32Array(2048).fill(0)
  );

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Toggle oscillator on/off
  const toggleOscillator = () => {
    if (isPlaying) {
      // Stop the oscillator
      if (oscillatorNodeRef.current) {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
        oscillatorNodeRef.current = null;
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Update a single harmonic parameter
  const updateHarmonic = (
    index: number,
    paramType: "amplitude" | "phase",
    value: number
  ) => {
    const updatedHarmonics = [...harmonics];
    updatedHarmonics[index] = {
      ...updatedHarmonics[index],
      [paramType]: value,
    };
    setHarmonics(updatedHarmonics);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!keyboardEnabled) return;

    // Ignore repeated keydown events (key held down)
    if (event.repeat) return;

    // Find the matching note for this key
    const keyPressed = event.key.toLowerCase();
    const noteIndex = keyboardNotes.findIndex(
      (note) => note.key === keyPressed
    );

    if (noteIndex !== -1) {
      // Update keyboard notes state to show active key
      const updatedKeyboardNotes = [...keyboardNotes];
      updatedKeyboardNotes[noteIndex].isActive = true;
      setKeyboardNotes(updatedKeyboardNotes);
      setActiveKey(keyPressed);

      // Set the frequency to the note's frequency
      setFrequency(keyboardNotes[noteIndex].frequency);

      // Start the oscillator if it's not already playing
      if (!isPlaying) {
        setIsPlaying(true);
      } else if (oscillatorNodeRef.current) {
        // Update frequency if already playing
        oscillatorNodeRef.current.frequency.setValueAtTime(
          keyboardNotes[noteIndex].frequency,
          audioContextRef.current?.currentTime || 0
        );
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!keyboardEnabled) return;

    const keyReleased = event.key.toLowerCase();
    const noteIndex = keyboardNotes.findIndex(
      (note) => note.key === keyReleased
    );

    if (noteIndex !== -1) {
      // Update keyboard notes state to show inactive key
      const updatedKeyboardNotes = [...keyboardNotes];
      updatedKeyboardNotes[noteIndex].isActive = false;
      setKeyboardNotes(updatedKeyboardNotes);

      // Only stop the oscillator if the released key was the active key
      if (keyReleased === activeKey) {
        setActiveKey(null);
        // Check if any other keys are still active
        const anyKeysActive = updatedKeyboardNotes.some(
          (note) => note.isActive
        );
        if (!anyKeysActive && isPlaying) {
          // Stop the oscillator if no keys are active
          setIsPlaying(false);
        }
      }
    }
  };

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
      filter1.frequency.value = cutoff;
      filter1.Q.value = resonance;

      // Second BiquadFilter to cascade (creating a 4-pole/24dB per octave filter)
      const filter2 = audioContext.createBiquadFilter();
      filter2.type = "lowpass";
      filter2.frequency.value = cutoff;
      filter2.Q.value = resonance * 0.7; // Slightly reduce resonance on subsequent filters

      // Third BiquadFilter
      const filter3 = audioContext.createBiquadFilter();
      filter3.type = "lowpass";
      filter3.frequency.value = cutoff;
      filter3.Q.value = resonance * 0.4;

      // Fourth BiquadFilter
      const filter4 = audioContext.createBiquadFilter();
      filter4.type = "lowpass";
      filter4.frequency.value = cutoff;
      filter4.Q.value = resonance * 0.2;

      // Store the first filter for parameter updates
      filterNodeRef.current = filter1;

      // Create oscillator node
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = frequency;

      // Generate and set custom waveform from Fourier series
      const calculatedWaveform = calculateWaveform(harmonics);
      setWaveform(calculatedWaveform);

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
  }, [isPlaying, frequency, harmonics, cutoff, resonance]);

  // Draw the waveform on canvas
  useEffect(() => {
    const canvas = document.getElementById(
      "waveform-canvas"
    ) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerY = canvas.height / 2;
        const scaleY = (canvas.height / 2) * 0.9; // 90% of half-height for padding

        // Draw center line (zero axis)
        ctx.beginPath();
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();

        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;

        // Start the path at the first point
        ctx.moveTo(0, centerY - waveform[0] * scaleY);

        // Connect all subsequent points
        for (let i = 1; i < waveform.length; i++) {
          const x = (i / waveform.length) * canvas.width;
          const y = centerY - waveform[i] * scaleY;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    }
  }, [waveform]);

  // Setup keyboard event listeners
  useEffect(() => {
    if (keyboardEnabled) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyboardEnabled, keyboardNotes]);

  // Initialize keyboard dependencies dependency
  useEffect(() => {
    // When keyboard mode is enabled, show a notification and ensure the audio context is initialized
    if (keyboardEnabled) {
      // Initialize audio context if needed when switching to keyboard mode
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
    }
  }, [keyboardEnabled]);

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
          {/* Button to start/stop the oscillator */}
          {/* <Grid size={3} sx={{ alignContent: "center" }}>
            <Button
              variant="contained"
              color={isPlaying ? "error" : "primary"}
              fullWidth
              startIcon={isPlaying ? <StopIcon /> : <PlayIcon />}
              onClick={toggleOscillator}
            >
              {isPlaying ? "Stop" : "Start"} Oscillator
            </Button>
          </Grid> */}
          {/* Keyboard mode toggle button */}
          {/* <Grid size={12} sx={{ alignContent: "center" }}>
            <Button
              variant="contained"
              color={keyboardEnabled ? "secondary" : "primary"}
              fullWidth
              onClick={toggleKeyboardMode}
              sx={{ ml: 2 }}
            >
              {keyboardEnabled ? "Disable" : "Enable"} Keyboard
            </Button>
          </Grid> */}
          {/* Frequency slider */}
          {/* <Grid container size={6} direction="column" alignItems={"center"}>
            <Grid>
              <Typography id="frequency-slider" gutterBottom>
                Frequency: {frequency} Hz
              </Typography>
            </Grid>
            <Grid size={12}>
              <Slider
                value={frequency}
                min={20}
                max={2000}
                onChange={(_, value) => setFrequency(value as number)}
                aria-labelledby="frequency-slider"
              />
            </Grid>
          </Grid> */}
          {/* Waveform visualizer */}
          <Grid size={4}>
            <Paper sx={{ mb: 2, height: "100%" }}>
              <Typography variant="h3" align="center">
                Waveform isualization
              </Typography>
              <canvas
                id="waveform-canvas"
                style={{
                  width: "100%",
                  height: "90%",
                  border: "1px solid #333",
                  display: "block",
                }}
              />
            </Paper>
          </Grid>
          {/* Equation Display */}
          <Grid size={4}>
            <Paper sx={{ display: "grid" }}>
              <Typography variant="h3" align="center">
                Fourier Series Equation
              </Typography>
              <Grid>
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: "italic",
                    color: "text.secondary",
                  }}
                >
                  Where ω = 2π · {frequency} Hz
                </Typography>
              </Grid>
              <Grid>
                <BlockMath math={generateFourierEquation(harmonics)} />
              </Grid>
            </Paper>
          </Grid>
          {/* Plain text format of the equation */}
          <Grid size={4}>
            <Paper>
              <Typography variant="h3" align="center">
                Plain Text Format
              </Typography>
              {generateFullEquation(harmonics)
                .replace(/\\sum_/g, "Σ")
                .replace(/\\sin/g, "sin")
                .replace(/\\phi/g, "φ")
                .replace(/\\_/g, "_")
                .replace(/\\\{/g, "{")
                .replace(/\\\}/g, "}")
                .replace(/\\\(/g, "(")
                .replace(/\\\)/g, ")")
                .replace(/\\\[/g, "[")
                .replace(/\\\]/g, "]")
                .replace(/\\\\/g, "\\")
                .split("\n")
                .map((line, i) => (
                  <Box key={i} component="div">
                    {line}
                  </Box>
                ))}
            </Paper>
          </Grid>
          {/* Harmonics control panel */}
          <Grid size={6}>
            <Paper sx={{ height: "100%", overflow: "hidden" }}>
              <Typography variant="h3" align="center">
                Harmonic Components
              </Typography>
              <Stack spacing={1.5}>
                {harmonics.map((harmonic, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      bgcolor: "rgba(97, 218, 251, 0.1)",
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 0.5, color: "primary.main" }}
                    >
                      H{idx + 1} ({(idx + 1) * frequency} Hz)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography
                          variant="caption"
                          id={`amplitude-slider-${idx}`}
                        >
                          A (amplitude): {harmonic.amplitude.toFixed(2)}
                        </Typography>
                        <Slider
                          size="small"
                          value={harmonic.amplitude}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(_, value) =>
                            updateHarmonic(idx, "amplitude", value as number)
                          }
                          aria-labelledby={`amplitude-slider-${idx}`}
                        />
                      </Grid>
                      <Grid size={6}>
                        <Typography
                          variant="caption"
                          id={`phase-slider-${idx}`}
                        >
                          φ (phase): {(harmonic.phase / Math.PI).toFixed(2)}π
                        </Typography>
                        <Slider
                          size="small"
                          value={harmonic.phase}
                          min={-Math.PI}
                          max={Math.PI}
                          step={0.01}
                          onChange={(_, value) =>
                            updateHarmonic(idx, "phase", value as number)
                          }
                          aria-labelledby={`phase-slider-${idx}`}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid size={6}>
            <Paper>
              <Typography variant="h3" align="center">
                Subtractive Controls
              </Typography>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  4-Pole (24dB/oct) Low-Pass Filter
                </Typography>

                {/* Cutoff frequency control */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary.main"
                    gutterBottom
                  >
                    Cutoff Frequency: {cutoff} Hz
                  </Typography>
                  <Slider
                    value={cutoff}
                    min={20}
                    max={20000}
                    step={1}
                    scale={(x) => Math.pow(x, 2) / 20000} // Logarithmic scale for more natural frequency control
                    onChange={(_, value) => {
                      setCutoff(value as number);
                      // Update filter cutoff in real time if playing
                      if (filterNodeRef.current && audioContextRef.current) {
                        const time = audioContextRef.current.currentTime;
                        // Apply slight smoothing to avoid clicks
                        filterNodeRef.current.frequency.exponentialRampToValueAtTime(
                          value as number,
                          time + 0.01
                        );
                      }
                    }}
                  />
                </Box>

                {/* Resonance control */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary.main"
                    gutterBottom
                  >
                    Resonance: {resonance.toFixed(2)}
                  </Typography>
                  <Slider
                    value={resonance}
                    min={0}
                    max={20}
                    step={0.1}
                    onChange={(_, value) => {
                      setResonance(value as number);
                      // Update filter resonance in real time if playing
                      if (filterNodeRef.current && audioContextRef.current) {
                        const time = audioContextRef.current.currentTime;
                        // Apply slight smoothing to avoid clicks
                        filterNodeRef.current.Q.linearRampToValueAtTime(
                          value as number,
                          time + 0.01
                        );
                      }
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    mt: 4,
                    p: 2,
                    bgcolor: "rgba(97, 218, 251, 0.1)",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    This is a 4-pole (24dB/octave) low-pass filter achieved by
                    cascading four 2-pole filters. Adjust the cutoff to remove
                    high frequencies, and increase resonance for a more
                    pronounced filter effect.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Visual Keyboard Component */}
          {keyboardEnabled && (
            <Grid size={12}>
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h3" align="center" gutterBottom>
                  Keyboard Controls
                </Typography>
                <Typography variant="body2" align="center" gutterBottom>
                  Press keys on your keyboard to play notes. Active note:{" "}
                  {activeKey
                    ? keyboardNotes.find((note) => note.key === activeKey)?.note
                    : "None"}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 0.5,
                    my: 2,
                  }}
                >
                  {keyboardNotes.map((note, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 1,
                        minWidth: "40px",
                        textAlign: "center",
                        bgcolor: note.isActive
                          ? "secondary.main"
                          : note.note.includes("#")
                          ? "#333"
                          : "#fff",
                        color: note.note.includes("#") ? "#fff" : "#000",
                        border: "1px solid #666",
                        boxShadow: note.isActive ? 4 : 1,
                        transition: "all 0.1s ease",
                        position: note.note.includes("#")
                          ? "relative"
                          : "static",
                        zIndex: note.note.includes("#") ? 1 : "auto",
                        transform: note.isActive ? "translateY(2px)" : "none",
                      }}
                    >
                      <Typography variant="caption" display="block">
                        {note.key}
                      </Typography>
                      <Typography variant="body2">{note.note}</Typography>
                      <Typography variant="caption" display="block">
                        {note.frequency.toFixed(0)} Hz
                      </Typography>
                    </Paper>
                  ))}
                </Box>
                <Typography variant="caption" align="center" display="block">
                  Keyboard layout follows a piano layout (A-K keys for white
                  notes, W-P for black notes)
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
