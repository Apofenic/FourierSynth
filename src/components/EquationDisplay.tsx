import React from "react";
import { Paper, Typography, Grid, Box, Divider } from "@mui/material";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { useSynthControls } from "../contexts/SynthControlsContext";
import { useAudioEngine } from "../contexts/AudioEngineContext";
import {
  generateFourierEquation,
  generateFullEquation,
} from "../helperFunctions";

/**
 * EquationDisplay component
 * Renders the Fourier series equation using KaTeX for mathematical formatting
 * and displays a plain text version for accessibility
 */
export const EquationDisplay: React.FC = () => {
  const { harmonics } = useSynthControls();
  const { frequency } = useAudioEngine();

  // Convert LaTeX equation to plain text with Unicode symbols
  const plainTextEquation = generateFullEquation(harmonics)
    .replace(/\\sum_/g, "Σ")
    .replace(/\\sin/g, "sin")
    .replace(/\\phi/g, "φ")
    .replace(/\\omega/g, "ω")
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
    <Paper sx={{ display: "grid" }}>
      <Typography variant="h3" align="center">
        Fourier Series Equation
      </Typography>
      <Grid>
        <Typography
          variant="body2"
          sx={{
            fontStyle: "italic",
            color: "text.secondary",
          }}
        >
          Where ω = 2π · {frequency} Hz
        </Typography>
      </Grid>
      <Grid>
        <BlockMath math={generateFourierEquation(harmonics)} />
      </Grid>

      <Divider sx={{ mx: 2, my: 2 }} />

      <Box
        sx={{
          p: 2,
          bgcolor: "rgba(97, 218, 251, 0.05)",
        }}
      >
        <Typography variant="subtitle2" color="primary.main" gutterBottom>
          Plain Text Format:
        </Typography>
        {plainTextEquation.map((line, i) => (
          <Box
            key={i}
            component="div"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}
          >
            {line}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
