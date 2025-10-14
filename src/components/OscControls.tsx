import React from "react";
import { WaveformVisualizer, EquationDisplay } from "./";
import { Box, Typography, Paper, Slider, Stack } from "@mui/material";

export const OscControls: React.FC = () => {
  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: "3.5fr 1fr",
        gap: 1,
        padding: 1,
        overflow: "hidden",
        minHeight: 0,
        height: "100%",
      }}
    >
      <Box sx={{ overflow: "hidden", minHeight: 0 }}>
        <WaveformVisualizer />
      </Box>
      <Box sx={{ overflow: "hidden", minHeight: 0 }}>
        <EquationDisplay />
      </Box>
      <Paper
        sx={{
          gridColumn: "1 / -1",
          gridRow: 2,
          overflow: "hidden",
          minHeight: 0,
          height: "100%",
        }}
      ></Paper>
    </Paper>
  );
};
