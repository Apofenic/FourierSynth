import React from "react";
import { Paper, Typography, Stack, Grid } from "@mui/material";
import {
  useSynthControlsStore,
  useAudioEngineStore,
  useEquationBuilderStore,
} from "../../stores";
import { ModDial } from "../ModDial";

interface HarmonicsControlProps {
  oscillatorIndex: number;
}

/**
 * HarmonicsControl component
 * Provides sliders to control the amplitude and phase of each harmonic
 */
export const HarmonicsControl: React.FC<HarmonicsControlProps> = ({
  oscillatorIndex,
}) => {
  const oscillator = useSynthControlsStore(
    (state) => state.oscillators[oscillatorIndex]
  );
  const harmonics = oscillator?.harmonics || [];
  const updateHarmonic = useSynthControlsStore((state) => state.updateHarmonic);
  const oscillatorFrequency = useAudioEngineStore(
    (state) => state.oscillators[oscillatorIndex]?.frequency || 220
  );
  const nValue = useEquationBuilderStore(
    (state) => state.oscillators[oscillatorIndex].variables.n?.value ?? 8
  );

  // Determine how many harmonics to display based on 'n' variable
  const numHarmonicsToDisplay = Math.min(
    Math.max(1, Math.round(nValue)),
    harmonics.length
  );
  const displayedHarmonics = harmonics.slice(0, numHarmonicsToDisplay);

  return (
    <Paper sx={{ height: "100%", overflow: "auto", p: 2 }}>
      <Typography variant="h3" align="center">
        Harmonic Components (n={numHarmonicsToDisplay})
      </Typography>
      <Grid container spacing={2}>
        {displayedHarmonics.map((harmonic, idx) => (
          <Grid size={3} key={idx}>
            <Paper
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
                H{idx + 1} ({(idx + 1) * oscillatorFrequency} Hz)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <ModDial
                    value={harmonic.amplitude}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) =>
                      updateHarmonic(oscillatorIndex, idx, "amplitude", value)
                    }
                    label={`A: ${harmonic.amplitude.toFixed(2)}`}
                    size={90}
                    ringColor="#2ecc71"
                    numberFontSize={16}
                    minMaxFontSize={10}
                  />
                </Grid>
                <Grid size={6}>
                  <ModDial
                    value={harmonic.phase}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.01}
                    onChange={(value) =>
                      updateHarmonic(oscillatorIndex, idx, "phase", value)
                    }
                    label={`φ: ${(harmonic.phase / Math.PI).toFixed(2)}π`}
                    size={90}
                    ringColor="#3498db"
                    numberFontSize={16}
                    minMaxFontSize={10}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// Mark for Why Did You Render tracking
HarmonicsControl.whyDidYouRender = true;
