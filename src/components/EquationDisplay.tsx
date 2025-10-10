import React from "react";
import { Paper, Typography, Grid } from "@mui/material";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { useSynthControls } from "../contexts/SynthControlsContext";
import { useAudioEngine } from "../contexts/AudioEngineContext";
import { generateFourierEquation } from "../helperFunctions";

/**
 * EquationDisplay component
 * Renders the Fourier series equation using KaTeX for mathematical formatting
 */
export const EquationDisplay: React.FC = () => {
  const { harmonics } = useSynthControls();
  const { frequency } = useAudioEngine();

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
    </Paper>
  );
};
