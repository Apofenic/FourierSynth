import React, { useState, useEffect, useRef } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./App.css";

// MUI imports
import {
  Container,
  Typography,
  Button,
  Slider,
  Box,
  Paper,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Stack,
  useMediaQuery,
  PaperTypeMap,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { PlayArrow as PlayIcon, Stop as StopIcon } from "@mui/icons-material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
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
// Define interfaces for our state
interface HarmonicParam {
  amplitude: number;
  phase: number;
}

// Math equation component to render beautiful equations
const MathEquation: React.FC<{ equation: string }> = ({ equation }) => {
  return (
    <Box className="math-equation">
      <BlockMath math={equation} />
    </Box>
  );
};

// Create a dark theme for our application
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
  // Audio context and node references
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // State for audio playing status
  const [isPlaying, setIsPlaying] = useState(false);

  // Fundamental frequency
  const [frequency, setFrequency] = useState(220);

  // Harmonics parameters (amplitude and phase for each harmonic)
  const [harmonics, setHarmonics] = useState<HarmonicParam[]>([
    { amplitude: 1.0, phase: 0 }, // Fundamental
    { amplitude: 0.5, phase: 0 }, // 2nd harmonic
    { amplitude: 0.33, phase: 0 }, // 3rd harmonic
    { amplitude: 0.25, phase: 0 }, // 4th harmonic
    { amplitude: 0.2, phase: 0 }, // 5th harmonic
    { amplitude: 0.16, phase: 0 }, // 6th harmonic
    { amplitude: 0.14, phase: 0 }, // 7th harmonic
    { amplitude: 0.125, phase: 0 }, // 8th harmonic
  ]);

  // Custom waveform array (will store our Fourier series output)
  const [waveform, setWaveform] = useState<Float32Array>(
    new Float32Array(2048).fill(0)
  );

  // Check if screen is mobile
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Function to calculate waveform using Fourier series
  const calculateWaveform = () => {
    const newWaveform = new Float32Array(2048);
    const TWO_PI = Math.PI * 2;

    for (let i = 0; i < newWaveform.length; i++) {
      const x = i / newWaveform.length;
      let value = 0;

      // Sum up the harmonic components using Fourier series
      harmonics.forEach((harmonic, idx) => {
        const harmonicNumber = idx + 1;
        value +=
          harmonic.amplitude *
          Math.sin(TWO_PI * harmonicNumber * x + harmonic.phase);
      });

      // Normalize to the range [-1, 1]
      newWaveform[i] = value;
    }

    // Normalize the waveform to prevent clipping
    const maxAmplitude = Math.max(...Array.from(newWaveform).map(Math.abs));
    if (maxAmplitude > 1) {
      for (let i = 0; i < newWaveform.length; i++) {
        newWaveform[i] /= maxAmplitude;
      }
    }

    return newWaveform;
  };

  // Generate the Fourier series equation as a string
  const generateFourierEquation = () => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);

    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }

    return `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;
  };

  // Generate full equation with harmonics details for plain text display
  const generateFullEquation = () => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);

    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }

    let generalForm = `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;

    generalForm += "\n\nWhere:";
    activeHarmonics.forEach((harmonic, idx) => {
      const n = idx + 1;
      const amplitude = harmonic.amplitude.toFixed(2);
      const phaseInPi = (harmonic.phase / Math.PI).toFixed(2);
      const phaseSign = harmonic.phase >= 0 ? "+" : "";

      generalForm += `\nA_${n} = ${amplitude}, \\phi_${n} = ${phaseSign}${phaseInPi}\\pi`;
    });

    return generalForm;
  };

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
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create oscillator node
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = frequency;

      // Generate and set custom waveform from Fourier series
      const calculatedWaveform = calculateWaveform();
      setWaveform(calculatedWaveform);

      // Create a custom wave table from our calculated waveform
      const waveTable = audioContext.createPeriodicWave(
        calculatedWaveform, // Real part (sine components)
        new Float32Array(calculatedWaveform.length).fill(0) // Imaginary part (cosine components)
      );

      oscillatorNode.setPeriodicWave(waveTable);
      oscillatorNode.connect(gainNode);
      oscillatorNode.start();
      oscillatorNodeRef.current = oscillatorNode;

      return () => {
        // Clean up
        if (oscillatorNodeRef.current) {
          oscillatorNodeRef.current.stop();
          oscillatorNodeRef.current.disconnect();
          oscillatorNodeRef.current = null;
        }
      };
    }
  }, [isPlaying, frequency, harmonics]);

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
          <Grid size={3} sx={{ alignContent: "center" }}>
            <Button
              variant="contained"
              color={isPlaying ? "error" : "primary"}
              fullWidth
              startIcon={isPlaying ? <StopIcon /> : <PlayIcon />}
              onClick={toggleOscillator}
            >
              {isPlaying ? "Stop" : "Start"} Oscillator
            </Button>
          </Grid>
          {/* Frequency slider */}
          <Grid container size={9} direction="column" alignItems={"center"}>
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
          </Grid>
          {/* Waveform visualizer */}
          <Grid size={4}>
            <Paper sx={{ mb: 2, height: "100%" }}>
              <Typography variant="h3" align="center">
                Waveform Visualization
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
            <Paper>
              <Typography variant="h3" align="center">
                Fourier Series Equation
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontStyle: "italic",
                  color: "text.secondary",
                }}
              >
                Where ω = 2π · {frequency} Hz
              </Typography>
              <MathEquation equation={generateFourierEquation()} />
            </Paper>
          </Grid>
          {/* Plain text format of the equation */}
          <Grid size={4}>
            <Paper>
              <Typography variant="h3" align="center">
                Plain Text Format
              </Typography>
              {generateFullEquation()
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
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;
