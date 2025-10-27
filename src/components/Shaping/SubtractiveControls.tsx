import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { useAudioEngine } from "../../contexts/AudioEngineContext";
import { FilterControls, EnvelopeControls, LFOControls } from "..";

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
    <Paper
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 2,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ gridRow: 1, minHeight: 0, overflow: "hidden" }}>
        <FilterControls
          cutoffFrequency={cutoffFrequency}
          resonance={resonance}
          onCutoffChange={handleCutoffChange}
          onResonanceChange={handleResonanceChange}
        />
      </Box>
      <Box sx={{ gridRow: 1, minHeight: "100%", overflow: "hidden" }}>
        <EnvelopeControls />
      </Box>
      <Box
        sx={{
          gridRow: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          minHeight: "100%",
          overflow: "hidden",
        }}
      >
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <LFOControls />
        </Box>
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <LFOControls />
        </Box>
      </Box>
    </Paper>
  );
};
