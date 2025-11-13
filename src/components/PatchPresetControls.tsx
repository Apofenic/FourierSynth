import React, { useState } from "react";
import {
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  ListSubheader,
} from "@mui/material";

export const PatchPresetControls: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handleChange = (event: any) => {
    setSelectedPreset(event.target.value);
  };

  return (
    <Paper sx={{ padding: 2, minWidth: 400 }}>
      <FormControl size="small" fullWidth>
        <InputLabel id="preset-select-label">Patch Presets</InputLabel>
        <Select
          labelId="preset-select-label"
          id="preset-select"
          value={selectedPreset}
          label="Patch Presets"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>

          <ListSubheader>Bass</ListSubheader>
          <MenuItem value="bass-deep">Deep Bass</MenuItem>
          <MenuItem value="bass-sub">Sub Bass</MenuItem>
          <MenuItem value="bass-wobble">Wobble Bass</MenuItem>

          <ListSubheader>Lead</ListSubheader>
          <MenuItem value="lead-bright">Bright Lead</MenuItem>
          <MenuItem value="lead-pluck">Pluck Lead</MenuItem>
          <MenuItem value="lead-saw">Saw Lead</MenuItem>

          <ListSubheader>Pad</ListSubheader>
          <MenuItem value="pad-warm">Warm Pad</MenuItem>
          <MenuItem value="pad-strings">String Pad</MenuItem>
          <MenuItem value="pad-ambient">Ambient Pad</MenuItem>

          <ListSubheader>FX</ListSubheader>
          <MenuItem value="fx-riser">Riser</MenuItem>
          <MenuItem value="fx-sweeper">Sweeper</MenuItem>
          <MenuItem value="fx-noise">Noise FX</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  );
};
