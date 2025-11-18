import React from "react";
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useSettingsStore } from "../stores/useSettingsStore";

/**
 * Settings component
 * Configuration panel for synth settings and preferences
 */
export const Settings: React.FC = () => {
  const bufferSize = useSettingsStore((state) => state.bufferSize);
  const setBufferSize = useSettingsStore((state) => state.setBufferSize);
  const oversample = useSettingsStore((state) => state.oversample);
  const setOversample = useSettingsStore((state) => state.setOversample);

  const handleBufferSizeChange = (event: SelectChangeEvent<number>) => {
    setBufferSize(event.target.value as number);
  };

  const handleOversampleChange = (event: SelectChangeEvent<string>) => {
    setOversample(event.target.value as OverSampleType);
  };

  return (
    <Paper sx={{ height: "100%", position: "relative" }}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h3">Settings</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="buffer-size-label">Buffer Size</InputLabel>
            <Select
              labelId="buffer-size-label"
              id="buffer-size-select"
              value={bufferSize}
              label="Buffer Size"
              onChange={handleBufferSizeChange}
            >
              <MenuItem value={512}>512 samples</MenuItem>
              <MenuItem value={1024}>1024 samples</MenuItem>
              <MenuItem value={2048}>2048 samples (Default)</MenuItem>
              <MenuItem value={4096}>4096 samples</MenuItem>
              <MenuItem value={8192}>8192 samples</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Higher buffer sizes provide better quality at high frequencies but
            use more memory. Changes take effect after regenerating waveforms.
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="oversample-label">Oversample</InputLabel>
            <Select
              labelId="oversample-label"
              id="oversample-select"
              value={oversample}
              label="Oversample"
              onChange={handleOversampleChange}
            >
              <MenuItem value="none">None (Default)</MenuItem>
              <MenuItem value="2x">2x</MenuItem>
              <MenuItem value="4x">4x</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Oversampling reduces aliasing and improves audio quality at the cost
            of increased CPU usage. Changes take effect after restarting audio.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
