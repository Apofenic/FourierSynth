import React from "react";
import "./App.css";
import {
  Typography,
  CssBaseline,
  ThemeProvider,
  Paper,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "auto 1.5fr 2fr auto",
          gap: 2,
          padding: "1rem",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header Section - Row 1, spans all 12 columns */}
        <Box sx={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <Typography variant="h1" align="center" gutterBottom>
            Fourier Series Synthesizer
          </Typography>
        </Box>

        {/* Waveform visualizer and Equation Display - Row 2, spans all 12 columns */}

        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 2,
            display: "flex",
            flexDirection: "row",
            gap: 2,
            p: 2,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <WaveformVisualizer />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ flex: 1 }}>
            <EquationDisplay />
          </Box>
        </Paper>

        {/* Harmonics and Subtractive Controls - Row 3, spans all 12 columns */}
        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 3,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="control tabs"
          >
            <Tab label="Harmonics Control" />
            <Tab label="Subtractive Controls" />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {activeTab === 0 && <HarmonicsControl />}
            {activeTab === 1 && <SubtractiveControls />}
          </Box>
        </Paper>

        {/* Visual Keyboard Component - Row 4, spans all 12 columns */}
        {keyboardEnabled && (
          <Box sx={{ gridColumn: "1 / -1", gridRow: 4 }}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="keyboard-controls-content"
                id="keyboard-controls-header"
              >
                <Typography variant="h3">Keyboard Controls</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <KeyboardControls />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
