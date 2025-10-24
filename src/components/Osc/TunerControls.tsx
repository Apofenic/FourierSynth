import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Slider,
  Tooltip,
  FormControlLabel,
  Stack,
  Switch,
} from "@mui/material";
import { Dial } from "../Dial";

export const TunerControls: React.FC = () => {
  const [legato, setLegato] = useState(false);
  const [octave, setOctave] = useState(0);
  const [fineTune, setFineTune] = useState(0);

  return (
    <Paper>
      <Typography variant="h3" align="center">
        Tuner
      </Typography>
      <Box
        sx={{ padding: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Stack spacing={2} alignItems="start">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={legato}
                onChange={(e) => setLegato(e.target.checked)}
                color="primary"
              />
            }
            label="Legato"
          />
        </Stack>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-evenly"
          alignItems="center"
        >
          <Dial
            value={octave}
            min={-3}
            max={3}
            onChange={setOctave}
            label="Octave"
            size={75}
            ringColor="#2ecc71"
            numberFontSize={18}
            minMaxFontSize={10}
          />
          <Dial
            value={fineTune}
            min={-100}
            max={100}
            onChange={setFineTune}
            label="Fine tune"
            size={75}
            ringColor="#2ecc71"
            numberFontSize={18}
            minMaxFontSize={10}
          />
        </Box>
      </Box>
    </Paper>
  );
};
