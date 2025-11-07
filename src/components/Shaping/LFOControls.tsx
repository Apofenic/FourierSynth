import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Dial } from "../Dial";
import { WaveformIcon } from "../WaveformIcon";

export const LFOControls = ({ id }: { id: number }) => {
  // LFO state
  const [lfoRate, setLfoRate] = useState(2); // Hz
  const [lfoDepth, setLfoDepth] = useState(50); // 0-100
  const [lfoWaveform, setLfoWaveform] = useState<string>("sine");
  const [lfoTarget, setLfoTarget] = useState<string>("pitch");

  const handleWaveformChange = (
    event: React.MouseEvent<HTMLElement>,
    newWaveform: string | null
  ) => {
    if (newWaveform !== null) {
      setLfoWaveform(newWaveform);
    }
  };

  const handleTargetChange = (
    event: React.MouseEvent<HTMLElement>,
    newTarget: string | null
  ) => {
    if (newTarget !== null) {
      setLfoTarget(newTarget);
    }
  };

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 2,
        overflow: "auto",
        height: "100%",
      }}
    >
      <Typography variant="h3" align="center">
        LFO {id}
      </Typography>

      {/* LFO Rate and Depth Controls */}
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Dial
          value={lfoRate}
          min={0.1}
          max={20}
          step={0.1}
          onChange={setLfoRate}
          label="Frequency (Hz)"
          size={90}
          ringColor="#1abc9c"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={lfoDepth}
          min={0}
          max={100}
          onChange={setLfoDepth}
          label="Amount"
          size={90}
          ringColor="#16a085"
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
          value={lfoWaveform}
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
