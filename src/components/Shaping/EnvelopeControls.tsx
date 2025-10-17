import React from "react";
import { Paper, Typography, Box, Slider, Tooltip } from "@mui/material";

export const EnvelopeControls: React.FC = () => {
  return (
    <Paper
      sx={{
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
        Envelopes
      </Typography>
    </Paper>
  );
};
