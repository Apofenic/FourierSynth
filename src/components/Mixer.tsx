import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useSynthControls } from "../contexts/SynthControlsContext";
import { Dial } from "./Dial";

export const Mixer: React.FC = () => {
  const [masterVolume, setMasterVolume] = React.useState<number>(75);
  const { keyboardEnabled, setKeyboardEnabled } = useSynthControls();

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
        <Stack spacing={2} alignItems="center">
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
          <Dial
            value={masterVolume}
            min={0}
            max={100}
            onChange={setMasterVolume}
            label="Master Volume"
            size={100}
            ringColor="#2ecc71"
          />
        </Stack>
      </Paper>
    </Box>
  );
};
