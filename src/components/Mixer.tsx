import React from "react";
import {
  Box,
  Typography,
  Paper,
  Slider,
  Stack,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useSynthControls } from "../contexts/SynthControlsContext";

export const Mixer: React.FC = () => {
  const [masterVolume, setMasterVolume] = React.useState<number>(75);
  const { keyboardEnabled, setKeyboardEnabled } = useSynthControls();

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setMasterVolume(newValue as number);
  };

  const handleKeyboardToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyboardEnabled(event.target.checked);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 2,
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Typography variant="h3" align="center" gutterBottom>
          Mixer Controls
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={keyboardEnabled}
                onChange={handleKeyboardToggle}
                color="primary"
              />
            }
            label="Enable Keyboard"
          />
          <Typography variant="body1">Master Volume</Typography>
          <Slider
            value={masterVolume}
            onChange={handleVolumeChange}
            aria-label="Master Volume"
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
        </Stack>
      </Paper>
    </Box>
  );
};
