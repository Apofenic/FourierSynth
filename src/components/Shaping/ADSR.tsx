import React from "react";
import { Paper, Typography, Stack } from "@mui/material";
import { Dial } from "../Custom_UI_Components/Dial";
import { ADSRParams } from "../../types";

export const ADSR = ({
  label,
  state,
  update,
}: {
  label: string;
  state: ADSRParams;
  update: (field: keyof ADSRParams, value: number) => void;
}) => {
  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      <Typography variant="h3" align="center" sx={{ marginBottom: 0 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Dial
          value={state.attack}
          min={0}
          max={100}
          onChange={(value) => update("attack", value)}
          label="Attack"
          size={80}
          ringColor="#3498db"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={state.decay}
          min={0}
          max={100}
          onChange={(value) => update("decay", value)}
          label="Decay"
          size={80}
          ringColor="#9b59b6"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={state.sustain}
          min={0}
          max={100}
          onChange={(value) => update("sustain", value)}
          label="Sustain"
          size={80}
          ringColor="#e67e22"
          numberFontSize={16}
          minMaxFontSize={10}
        />
        <Dial
          value={state.release}
          min={0}
          max={100}
          onChange={(value) => update("release", value)}
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
