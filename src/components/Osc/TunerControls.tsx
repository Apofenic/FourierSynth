import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  FormControlLabel,
  Stack,
  Switch,
} from "@mui/material";
import { Dial, ModDial } from "..";
import { useSynthControlsStore } from "../../stores";

interface TunerControlsProps {
  oscillatorIndex: number;
}

export const TunerControls: React.FC<TunerControlsProps> = ({
  oscillatorIndex,
}) => {
  const [legato, setLegato] = useState(false);

  const detune = useSynthControlsStore(
    (state) => state.oscillators[oscillatorIndex].detune
  );
  const updateDetune = useSynthControlsStore((state) => state.updateDetune);

  return (
    <Paper>
      <Box
        sx={{ padding: 0, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Stack spacing={2} alignItems="start">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={legato}
                onChange={(e) => setLegato(e.target.checked)}
                color="primary"
                disabled
              />
            }
            label="Legato"
          />
        </Stack>
        <Paper>
          <Typography variant="h3" align="center">
            Detune
          </Typography>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-evenly"
            alignItems="center"
          >
            <ModDial
              value={detune.octave}
              min={-2}
              max={2}
              onChange={(value) =>
                updateDetune(oscillatorIndex, "octave", value)
              }
              label="Octave"
              size={75}
              ringColor="#2ecc71"
              numberFontSize={18}
              minMaxFontSize={10}
            />
            <ModDial
              value={detune.semitone}
              min={-12}
              max={12}
              onChange={(value) =>
                updateDetune(oscillatorIndex, "semitone", value)
              }
              label="Semitone"
              size={75}
              ringColor="#2ecc71"
              numberFontSize={18}
              minMaxFontSize={10}
            />
            <ModDial
              value={detune.cent}
              min={-100}
              max={100}
              onChange={(value) => updateDetune(oscillatorIndex, "cent", value)}
              label="cent"
              size={75}
              ringColor="#2ecc71"
              numberFontSize={18}
              minMaxFontSize={10}
            />
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};
