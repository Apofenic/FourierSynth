import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useAudioEngineStore, useSynthControlsStore } from "../stores";
import { Dial, ModDial } from "./";

export const Mixer: React.FC = () => {
  // Connect to stores
  const oscillators = useAudioEngineStore((state) => state.oscillators);
  const masterVolume = useAudioEngineStore((state) => state.masterVolume);
  const updateOscillatorVolume = useAudioEngineStore(
    (state) => state.updateOscillatorVolume
  );
  const updateMasterVolume = useAudioEngineStore(
    (state) => state.updateMasterVolume
  );

  const keyboardEnabled = useSynthControlsStore(
    (state) => state.keyboardEnabled
  );
  const setKeyboardEnabled = useSynthControlsStore(
    (state) => state.setKeyboardEnabled
  );

  const handleKeyboardToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyboardEnabled(event.target.checked);
  };

  const handleOscVolumeChange = (oscIndex: number, volume: number) => {
    // Convert 0-100 range to 0-1 for audio engine
    updateOscillatorVolume(oscIndex, volume / 100);
  };

  const handleMasterVolumeChange = (volume: number) => {
    updateMasterVolume(volume);
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
            onChange={handleMasterVolumeChange}
            label="Master Volume"
            size={75}
            ringColor="#2ecc71"
          />
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto",
          }}
        >
          <ModDial
            value={oscillators[0].volume * 100}
            min={0}
            max={100}
            onChange={(vol) => handleOscVolumeChange(0, vol)}
            label="Osc 1 Volume"
            size={75}
            ringColor={oscillators[0].isActive ? "#2ecc71" : "#95a5a6"}
          />
          <ModDial
            value={oscillators[1].volume * 100}
            min={0}
            max={100}
            onChange={(vol) => handleOscVolumeChange(1, vol)}
            label="Osc 2 Volume"
            size={75}
            ringColor={oscillators[1].isActive ? "#2ecc71" : "#95a5a6"}
          />
          <ModDial
            value={oscillators[2].volume * 100}
            min={0}
            max={100}
            onChange={(vol) => handleOscVolumeChange(2, vol)}
            label="Osc 3 Volume"
            size={75}
            ringColor={oscillators[2].isActive ? "#2ecc71" : "#95a5a6"}
          />
          <ModDial
            value={oscillators[3].volume * 100}
            min={0}
            max={100}
            onChange={(vol) => handleOscVolumeChange(3, vol)}
            label="Osc 4 Volume"
            size={75}
            ringColor={oscillators[3].isActive ? "#2ecc71" : "#95a5a6"}
            numberFontSize={18}
            minMaxFontSize={10}
          />
        </Box>

        <Stack spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={false}
                onChange={() => {}}
                color="primary"
                disabled
              />
            }
            label="unison"
          />
        </Stack>
      </Paper>
    </Box>
  );
};
