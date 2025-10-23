import React, { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Dial } from "./Dial";

/**
 * Example component demonstrating the usage of the Dial component
 * This shows various configurations and use cases
 */
export const DialExample: React.FC = () => {
  const [volume, setVolume] = useState(46);
  const [frequency, setFrequency] = useState(440);
  const [resonance, setResonance] = useState(0.5);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Dial Component Examples
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          justifyContent: "center",
          mt: 3,
        }}
      >
        {/* Basic dial matching the screenshot */}
        <Dial
          value={volume}
          min={0}
          max={100}
          onChange={setVolume}
          label="Volume"
          size={200}
          ringColor="#2ecc71"
        />

        {/* Frequency dial with different range */}
        <Dial
          value={frequency}
          min={20}
          max={2000}
          step={10}
          onChange={setFrequency}
          label="Frequency"
          size={180}
          ringColor="#61dafb"
        />

        {/* Smaller dial with decimal values */}
        <Dial
          value={resonance}
          min={0}
          max={1}
          step={0.01}
          onChange={setResonance}
          label="Resonance"
          size={150}
          ringColor="#e74c3c"
        />
      </Box>
    </Paper>
  );
};
