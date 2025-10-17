import React from "react";
import { Paper, Typography, Box, Slider, Tooltip } from "@mui/material";

export const TunerControls: React.FC = () => {
  return (
    <Paper
      sx={{
        gridColumn: "1 / -1",
        gridRow: 2,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto 1fr",
        gap: 1,
        p: 1,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Typography variant="h3" align="center">
        Tuner
      </Typography>
    </Paper>
  );
};
