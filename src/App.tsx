import React from "react";
import "./App.css";
import {
  Typography,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import { EquationDisplay } from "./components/EquationDisplay";
import { PlainTextEquation } from "./components/PlainTextEquation";
import { HarmonicsControl } from "./components/HarmonicsControl";
import { SubtractiveControls } from "./components/SubtractiveControls";
import { KeyboardControls } from "./components/KeyboardControls";
import { useSynthControls } from "./contexts/SynthControlsContext";
import { useAudioInitializer } from "./hooks/useAudioInitializer";

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
  // Get keyboard state from context
  const { keyboardEnabled } = useSynthControls();

  // Initialize audio engine with harmonics
  useAudioInitializer();

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
