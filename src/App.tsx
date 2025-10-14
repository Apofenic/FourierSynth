import React from "react";
import "./App.css";
import {
  Typography,
  CssBaseline,
  ThemeProvider,
  Paper,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import {
  WaveformVisualizer,
  EquationDisplay,
  HarmonicsControl,
  SubtractiveControls,
  KeyboardControls,
  Mixer,
  OscControls,
} from "./components";
import { useSynthControls } from "./contexts/SynthControlsContext";
import { theme } from "./theme";

function App() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeOsc, setActiveOsc] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOscChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveOsc(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "auto 1fr 1fr",
          gap: 2,
          padding: "1rem",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header Section - Row 1, spans all 12 columns */}
        <Box sx={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <Typography variant="h1" align="center" gutterBottom>
            FourierSynth
          </Typography>
        </Box>
        {/* Oscillator and Mixer Section - Row 2, spans all 12 columns */}
        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 2,
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            gap: 2,
            padding: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Tabs
                value={activeOsc}
                onChange={handleOscChange}
                aria-label="oscillator tabs"
                sx={{ flexShrink: 0 }}
              >
                <Tab label="Osc 1" />
                <Tab label="Osc 2" />
                <Tab label="Osc 3" />
                <Tab label="Osc 4" />
              </Tabs>
              <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                {activeOsc === 0 && <OscControls />}
                {activeOsc === 1 && <OscControls />}
                {activeOsc === 2 && <OscControls />}
                {activeOsc === 3 && <OscControls />}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Mixer />
          </Box>
        </Paper>
        {/* Controls Section - Row 3, spans all 12 columns */}
        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 3,
            display: "grid",
            gridTemplateRows: "auto 1fr",
            overflow: "hidden",
            minHeight: 0,
            height: "100%",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="control tabs"
            sx={{ gridRow: 1 }}
          >
            <Tab label="Subtractive Controls" />
            <Tab label="Partials Controls" />
            <Tab label="Keyboard Layout" />
          </Tabs>
          <Box
            sx={{
              gridRow: 2,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {activeTab === 0 && <SubtractiveControls />}
            {activeTab === 1 && <HarmonicsControl />}
            {activeTab === 2 && <KeyboardControls />}
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
