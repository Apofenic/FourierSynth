import React from "react";
import {
  Paper,
  Typography,
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Dial } from "../Custom_UI_Components/Dial";
import { WaveformIcon } from "../Custom_UI_Components/WaveformIcon";
import { useAudioEngineStore } from "../../stores";
import { LFOWaveform } from "../../types";

export const LFOControls = ({ id }: { id: number }) => {
  const lfoIndex = id - 1; // Convert 1-based ID to 0-based index

  // Get LFO state from AudioEngine store
  const lfo = useAudioEngineStore((state) => state.lfos[lfoIndex]);
  const updateLFOFrequency = useAudioEngineStore(
    (state) => state.updateLFOFrequency
  );
  const updateLFOWaveform = useAudioEngineStore(
    (state) => state.updateLFOWaveform
  );
  const toggleLFO = useAudioEngineStore((state) => state.toggleLFO);

  const handleWaveformChange = (
    event: React.MouseEvent<HTMLElement>,
    newWaveform: string | null
  ) => {
    if (newWaveform !== null) {
      // Map string to LFOWaveform enum
      const waveformMap: Record<string, LFOWaveform> = {
        sine: LFOWaveform.SINE,
        triangle: LFOWaveform.TRIANGLE,
        square: LFOWaveform.SQUARE,
        sawtooth: LFOWaveform.SAWTOOTH,
      };
      updateLFOWaveform(lfoIndex, waveformMap[newWaveform]);
    }
  };

  const handleFrequencyChange = (frequency: number) => {
    updateLFOFrequency(lfoIndex, frequency);
    // Auto-enable LFO when frequency is adjusted
    if (!lfo.isActive) {
      toggleLFO(lfoIndex, true);
    }
  };

  // Map LFOWaveform enum back to string for UI
  const waveformString = lfo.waveform.toLowerCase();

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 2,
        overflow: "hidden",
        height: "100%",
        opacity: lfo.isActive ? 1 : 0.7,
        transition: "opacity 0.3s",
      }}
    >
      <Typography variant="h3" align="center">
        LFO {id}
        {lfo.isActive && (
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 1, color: "success.main" }}
          >
            ●
          </Typography>
        )}
      </Typography>

      {/* LFO Rate Control */}
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Dial
          value={lfo.frequency}
          min={0.1}
          max={20}
          step={0.1}
          onChange={handleFrequencyChange}
          label="Frequency (Hz)"
          size={90}
          ringColor={lfo.isActive ? "#1abc9c" : "#7f8c8d"}
          numberFontSize={16}
          minMaxFontSize={10}
        />
      </Stack>

      {/* LFO Waveform Selection */}
      <Box>
        <Typography variant="subtitle2" color="primary.main" gutterBottom>
          Waveform
        </Typography>
        <ToggleButtonGroup
          value={waveformString}
          exclusive
          onChange={handleWaveformChange}
          aria-label="LFO waveform"
          fullWidth
          size="small"
        >
          <ToggleButton value="sine" aria-label="sine wave">
            <WaveformIcon type="sine" size={15} />
          </ToggleButton>
          <ToggleButton value="triangle" aria-label="triangle wave">
            <WaveformIcon type="triangle" size={15} />
          </ToggleButton>
          <ToggleButton value="square" aria-label="square wave">
            <WaveformIcon type="square" size={15} />
          </ToggleButton>
          <ToggleButton value="sawtooth" aria-label="sawtooth wave">
            <WaveformIcon type="sawtooth" size={15} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
};
