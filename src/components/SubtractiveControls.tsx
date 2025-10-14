import React from "react";
import { Typography, Box } from "@mui/material";
import { useAudioEngine } from "../contexts/AudioEngineContext";
import { FilterControls, EnvelopeControls } from "./";

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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: " 1fr 1fr",
        gridTemplateRows: "auto 1fr",
        gap: 2,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ gridRow: 2, minHeight: 0, overflow: "hidden" }}>
        <FilterControls
          cutoffFrequency={cutoffFrequency}
          resonance={resonance}
          onCutoffChange={handleCutoffChange}
          onResonanceChange={handleResonanceChange}
        />
      </Box>
      <Box sx={{ gridRow: 2, minHeight: 0, overflow: "hidden" }}>
        <EnvelopeControls />
      </Box>
    </Box>
  );
};
