import React from "react";
import { WaveformVisualizer, EquationDisplay } from "..";
import { Box, Typography, Paper, Slider, Stack } from "@mui/material";
import { TunerControls } from "./TunerControls";
import { EquationBuilder } from "./EquationBuilder";
export const OscControls: React.FC = () => {
  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3.5fr",
        gap: 1,
        padding: 1,
        overflow: "hidden",
        minHeight: 0,
        height: "100%",
      }}
    >
      <Box
        sx={{
          gap: 1,
          overflow: "hidden",
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "2.5fr 1fr",
        }}
      >
        <WaveformVisualizer />
        <TunerControls />
      </Box>
      <Box sx={{ overflow: "hidden", minHeight: 0 }}>
        {/* <EquationDisplay /> */}
        <EquationBuilder />
      </Box>
    </Paper>
  );
};
