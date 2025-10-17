import React from "react";
import { Paper, Typography, Grid, Box, Divider } from "@mui/material";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { useSynthControls } from "../../contexts/SynthControlsContext";
import { useAudioEngine } from "../../contexts/AudioEngineContext";
import {
  generateFourierEquation,
  generateFullEquation,
} from "../../utils/helperFunctions";

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
    <Paper
      sx={{
        height: "100%",
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h3" align="center" gutterBottom>
        Fourier Series Equation
      </Typography>
      <Grid container spacing={2} sx={{ flex: 1 }}>
        {/* Fourier Equation - Left Side */}
        <Grid size={6} sx={{ display: "flex" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              width: "100%",
            }}
          >
            <BlockMath math={generateFourierEquation(harmonics)} />
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                color: "text.secondary",
              }}
            >
              Where ω = 2π · {frequency} Hz
            </Typography>
          </Box>
        </Grid>

        {/* Plain Text Format - Right Side */}
        <Grid size={6} sx={{ display: "flex" }}>
          {/* <Box
            sx={{
              flex: 1,
              p: 2,
              bgcolor: "rgba(97, 218, 251, 0.05)",
              borderRadius: 1,
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
          </Box> */}
        </Grid>
      </Grid>
    </Paper>
  );
};
