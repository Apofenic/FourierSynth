import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { useSynthControls } from "../../contexts/SynthControlsContext";
import { generateFullEquation } from "../../utils/helperFunctions";

/**
 * PlainTextEquation component
 * Displays the Fourier series equation in plain text format
 * as a fallback for accessibility or when LaTeX rendering is not available
 */
export const PlainTextEquation: React.FC = () => {
  const { harmonics } = useSynthControls();

  // Convert LaTeX equation to plain text with Unicode symbols
  const plainTextEquation = generateFullEquation(harmonics)
    .replace(/\\sum_/g, "Σ")
    .replace(/\\sin/g, "sin")
    .replace(/\\phi/g, "φ")
    .replace(/\\_/g, "_")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    .replace(/\\\\/g, "\\")
    .split("\n");

  return (
    <Paper>
      <Typography variant="h3" align="center">
        Plain Text Format
      </Typography>
      {plainTextEquation.map((line, i) => (
        <Box key={i} component="div">
          {line}
        </Box>
      ))}
    </Paper>
  );
};
