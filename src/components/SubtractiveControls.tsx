import React from "react";
import { Paper, Typography, Box, Slider } from "@mui/material";
import { useAudioEngine } from "../contexts/AudioEngineContext";

/**
 * SubtractiveControls component
 * Provides controls for the 4-pole low-pass filter (cutoff frequency and resonance)
 */
export const SubtractiveControls: React.FC = () => {
  const { cutoffFrequency, resonance, updateFilter } = useAudioEngine();

  const handleCutoffChange = (_: Event, value: number | number[]) => {
    const newCutoff = value as number;
    updateFilter(newCutoff, resonance);
  };

  const handleResonanceChange = (_: Event, value: number | number[]) => {
    const newResonance = value as number;
    updateFilter(cutoffFrequency, newResonance);
  };

  return (
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
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Cutoff Frequency: {cutoffFrequency} Hz
          </Typography>
          <Slider
            value={cutoffFrequency}
            min={20}
            max={20000}
            step={1}
            scale={(x) => Math.pow(x, 2) / 20000} // Logarithmic scale for more natural frequency control
            onChange={handleCutoffChange}
          />
        </Box>

        {/* Resonance control */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Resonance: {resonance.toFixed(2)}
          </Typography>
          <Slider
            value={resonance}
            min={0}
            max={20}
            step={0.1}
            onChange={handleResonanceChange}
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
            This is a 4-pole (24dB/octave) low-pass filter achieved by cascading
            four 2-pole filters. Adjust the cutoff to remove high frequencies,
            and increase resonance for a more pronounced filter effect.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
