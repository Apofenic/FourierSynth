import React from "react";
import "./App.css";
import { Typography, Grid, CssBaseline, ThemeProvider } from "@mui/material";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import { EquationDisplay } from "./components/EquationDisplay";
import { HarmonicsControl } from "./components/HarmonicsControl";
import { SubtractiveControls } from "./components/SubtractiveControls";
import { KeyboardControls } from "./components/KeyboardControls";
import { useSynthControls } from "./contexts/SynthControlsContext";
import { theme } from "./theme";

function App() {
  // Get keyboard state from context
  const { keyboardEnabled } = useSynthControls();

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
          <Grid size={6}>
            <WaveformVisualizer />
          </Grid>
          {/* Equation Display with Plain Text Format */}
          <Grid size={6}>
            <EquationDisplay />
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
