import React from "react";
import { Paper, Typography, Box, Stack } from "@mui/material";
import { Dial } from "../Dial";
import { useSynthControlsStore } from "../../stores/useSynthControlsStore";

export const EnvelopeControls: React.FC = () => {
  const ampADSR = useSynthControlsStore((state) => state.ampADSR);
  const filterADSR = useSynthControlsStore((state) => state.filterADSR);
  const updateAmpADSR = useSynthControlsStore((state) => state.updateAmpADSR);
  const updateFilterADSR = useSynthControlsStore(
    (state) => state.updateFilterADSR
  );

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 2,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Typography variant="h3" align="center" sx={{ marginBottom: 0 }}>
        Amp ADSR
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Dial
          value={ampADSR.attack}
          min={0}
          max={100}
          onChange={(value) => updateAmpADSR("attack", value)}
          label="Attack"
          size={80}
          ringColor="#3498db"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampADSR.decay}
          min={0}
          max={100}
          onChange={(value) => updateAmpADSR("decay", value)}
          label="Decay"
          size={80}
          ringColor="#9b59b6"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampADSR.sustain}
          min={0}
          max={100}
          onChange={(value) => updateAmpADSR("sustain", value)}
          label="Sustain"
          size={80}
          ringColor="#e67e22"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampADSR.release}
          min={0}
          max={100}
          onChange={(value) => updateAmpADSR("release", value)}
          label="Release"
          size={80}
          ringColor="#e74c3c"
          numberFontSize={16}
          minMaxFontSize={10}
        />
      </Stack>
      <Typography variant="h3" align="center" sx={{ marginBottom: 0 }}>
        Filter ADSR
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Dial
          value={filterADSR.attack}
          min={0}
          max={100}
          onChange={(value) => updateFilterADSR("attack", value)}
          label="Attack"
          size={80}
          ringColor="#3498db"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterADSR.decay}
          min={0}
          max={100}
          onChange={(value) => updateFilterADSR("decay", value)}
          label="Decay"
          size={80}
          ringColor="#9b59b6"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterADSR.sustain}
          min={0}
          max={100}
          onChange={(value) => updateFilterADSR("sustain", value)}
          label="Sustain"
          size={80}
          ringColor="#e67e22"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterADSR.release}
          min={0}
          max={100}
          onChange={(value) => updateFilterADSR("release", value)}
          label="Release"
          size={80}
          ringColor="#e74c3c"
          numberFontSize={16}
          minMaxFontSize={10}
        />
      </Stack>
    </Paper>
  );
};
