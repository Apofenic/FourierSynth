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
  const [osc1Volume, setOsc1Volume] = React.useState<number>(75);
  const [osc2Volume, setOsc2Volume] = React.useState<number>(75);
  const [osc3Volume, setOsc3Volume] = React.useState<number>(75);
  const [osc4Volume, setOsc4Volume] = React.useState<number>(75);
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto",
          }}
        >
          <Dial
            value={osc1Volume}
            min={0}
            max={100}
            onChange={setOsc1Volume}
            label="Osc 1 Volume"
            size={75}
            ringColor="#2ecc71"
          />
          <Dial
            value={osc2Volume}
            min={0}
            max={100}
            onChange={setOsc2Volume}
            label="Osc 2 Volume"
            size={75}
            ringColor="#2ecc71"
          />
          <Dial
            value={osc3Volume}
            min={0}
            max={100}
            onChange={setOsc3Volume}
            label="Osc 3 Volume"
            size={75}
            ringColor="#2ecc71"
          />
          <Dial
            value={osc4Volume}
            min={0}
            max={100}
            onChange={setOsc4Volume}
            label="Osc 4 Volume"
            size={75}
            ringColor="#2ecc71"
            numberFontSize={18}
            minMaxFontSize={10}
          />
        </Box>

        <Stack spacing={2} alignItems="start">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={false}
                onChange={() => {}}
                color="primary"
              />
            }
            label="unison"
          />
        </Stack>
      </Paper>
    </Box>
  );
};
