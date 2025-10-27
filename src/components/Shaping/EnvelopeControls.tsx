import React, { useState } from "react";
import { Paper, Typography, Box, Stack } from "@mui/material";
import { Dial } from "../Dial";

export const EnvelopeControls: React.FC = () => {
  // Amp ADSR state
  const [ampAttack, setAmpAttack] = useState(10);
  const [ampDecay, setAmpDecay] = useState(20);
  const [ampSustain, setAmpSustain] = useState(70);
  const [ampRelease, setAmpRelease] = useState(30);

  // Filter ADSR state
  const [filterAttack, setFilterAttack] = useState(10);
  const [filterDecay, setFilterDecay] = useState(20);
  const [filterSustain, setFilterSustain] = useState(70);
  const [filterRelease, setFilterRelease] = useState(30);

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
          value={ampAttack}
          min={0}
          max={100}
          onChange={setAmpAttack}
          label="Attack"
          size={80}
          ringColor="#3498db"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampDecay}
          min={0}
          max={100}
          onChange={setAmpDecay}
          label="Decay"
          size={80}
          ringColor="#9b59b6"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampSustain}
          min={0}
          max={100}
          onChange={setAmpSustain}
          label="Sustain"
          size={80}
          ringColor="#e67e22"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={ampRelease}
          min={0}
          max={100}
          onChange={setAmpRelease}
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
          value={filterAttack}
          min={0}
          max={100}
          onChange={setFilterAttack}
          label="Attack"
          size={80}
          ringColor="#3498db"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterDecay}
          min={0}
          max={100}
          onChange={setFilterDecay}
          label="Decay"
          size={80}
          ringColor="#9b59b6"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterSustain}
          min={0}
          max={100}
          onChange={setFilterSustain}
          label="Sustain"
          size={80}
          ringColor="#e67e22"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={filterRelease}
          min={0}
          max={100}
          onChange={setFilterRelease}
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
