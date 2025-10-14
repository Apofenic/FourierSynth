import React from "react";
import { Paper, Typography, Box, Slider, Tooltip } from "@mui/material";

interface FilterControlsProps {
  cutoffFrequency: number;
  resonance: number;
  onCutoffChange: (event: Event, value: number | number[]) => void;
  onResonanceChange: (event: Event, value: number | number[]) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  cutoffFrequency,
  resonance,
  onCutoffChange,
  onResonanceChange,
}) => {
  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gap: 2,
        p: 2,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          gridRow: 1,
        }}
      >
        Filters
      </Typography>
      <Tooltip
        title="This is a 4-pole (24dB/octave) low-pass filter achieved by cascading four 2-pole filters. Adjust the cutoff to remove high frequencies, and increase resonance for a more pronounced filter effect."
        arrow
        placement="top"
      >
        <Typography
          variant="h6"
          sx={{
            gridRow: 2,
            cursor: "help",
            textDecoration: "underline dotted",
            textUnderlineOffset: "4px",
          }}
        >
          4-Pole (24dB/oct) Low-Pass Filter
        </Typography>
      </Tooltip>

      <Box
        sx={{
          gridRow: 3,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          alignContent: "start",
        }}
      >
        {/* Cutoff frequency control */}
        <Box>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Cutoff Frequency: {cutoffFrequency} Hz
          </Typography>
          <Slider
            value={cutoffFrequency}
            min={20}
            max={20000}
            step={1}
            scale={(x) => Math.pow(x, 2) / 20000} // Logarithmic scale for more natural frequency control
            onChange={onCutoffChange}
          />
        </Box>

        {/* Resonance control */}
        <Box>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Resonance: {resonance.toFixed(2)}
          </Typography>
          <Slider
            value={resonance}
            min={0}
            max={20}
            step={0.1}
            onChange={onResonanceChange}
          />
        </Box>
      </Box>
    </Paper>
  );
};
