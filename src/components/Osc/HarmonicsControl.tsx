import React from "react";
import { Paper, Typography, Stack, Grid, Slider } from "@mui/material";
import { useSynthControlsStore, useAudioEngineStore } from "../../stores";

/**
 * HarmonicsControl component
 * Provides sliders to control the amplitude and phase of each harmonic
 */
export const HarmonicsControl: React.FC = () => {
  const harmonics = useSynthControlsStore((state) => state.harmonics);
  const updateHarmonic = useSynthControlsStore((state) => state.updateHarmonic);
  const frequency = useAudioEngineStore((state) => state.frequency);

  return (
    <Paper sx={{ height: "100%", overflow: "auto", p: 2 }}>
      <Typography variant="h3" align="center">
        Harmonic Components
      </Typography>
      <Stack spacing={1.5}>
        {harmonics.map((harmonic, idx) => (
          <Paper
            key={idx}
            sx={{
              bgcolor: "rgba(97, 218, 251, 0.1)",
              p: 1,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5, color: "primary.main" }}
            >
              H{idx + 1} ({(idx + 1) * frequency} Hz)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="caption" id={`amplitude-slider-${idx}`}>
                  A (amplitude): {harmonic.amplitude.toFixed(2)}
                </Typography>
                <Slider
                  size="small"
                  value={harmonic.amplitude}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(_, value) =>
                    updateHarmonic(idx, "amplitude", value as number)
                  }
                  aria-labelledby={`amplitude-slider-${idx}`}
                />
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" id={`phase-slider-${idx}`}>
                  φ (phase): {(harmonic.phase / Math.PI).toFixed(2)}π
                </Typography>
                <Slider
                  size="small"
                  value={harmonic.phase}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01}
                  onChange={(_, value) =>
                    updateHarmonic(idx, "phase", value as number)
                  }
                  aria-labelledby={`phase-slider-${idx}`}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
};
