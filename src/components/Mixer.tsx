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
  const ampEnvelopeAmount = useSynthControlsStore(
    (state) => state.ampEnvelopeAmount
  );
  const setAmpEnvelopeAmount = useSynthControlsStore(
    (state) => state.setAmpEnvelopeAmount
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

  const handleAmpEnvelopeAmountChange = (amount: number) => {
    setAmpEnvelopeAmount(amount);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minHeight: 0,
        minWidth: "180px",
        overflow: "hidden",
        "@media (max-width: 1999px)": {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          height: "auto",
          minWidth: "800px",
          p: 2,
          gap: 2,
        },
        "@media (max-width: 900px)": {
          flexDirection: "column",
          minWidth: "300px",
          p: 2,
          gap: 2,
        },
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ minWidth: "150px" }}>
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
        <Box sx={{ flexDirection: "row", display: "flex", gap: 4 }}>
          <Dial
            value={masterVolume}
            min={0}
            max={100}
            onChange={handleMasterVolumeChange}
            label="Master"
            size={75}
            ringColor="#2ecc71"
            numberFontSize={18}
            minMaxFontSize={10}
          />
          <Dial
            value={ampEnvelopeAmount}
            min={0}
            max={100}
            onChange={handleAmpEnvelopeAmountChange}
            label="Env Amount"
            size={75}
            ringColor="#3498db"
            numberFontSize={18}
            minMaxFontSize={10}
          />
        </Box>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto",
          gap: 0.5,
          minWidth: "180px",
          "@media (max-width: 1999px)": {
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gridTemplateRows: "1fr",
            minWidth: "400px",
            gap: 1,
          },
          "@media (max-width: 900px)": {
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto",
            minWidth: "300px",
            gap: 1,
          },
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
          numberFontSize={18}
          minMaxFontSize={10}
        />
        <ModDial
          value={oscillators[1].volume * 100}
          min={0}
          max={100}
          onChange={(vol) => handleOscVolumeChange(1, vol)}
          label="Osc 2 Volume"
          size={75}
          ringColor={oscillators[1].isActive ? "#2ecc71" : "#95a5a6"}
          numberFontSize={18}
          minMaxFontSize={10}
        />
        <ModDial
          value={oscillators[2].volume * 100}
          min={0}
          max={100}
          onChange={(vol) => handleOscVolumeChange(2, vol)}
          label="Osc 3 Volume"
          size={75}
          ringColor={oscillators[2].isActive ? "#2ecc71" : "#95a5a6"}
          numberFontSize={18}
          minMaxFontSize={10}
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
        {/* <FormControlLabel
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
          /> */}
      </Stack>
    </Paper>
  );
};
