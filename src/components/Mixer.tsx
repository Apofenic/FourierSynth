import React from "react";
import { Box, Typography, Paper, Slider, Stack } from "@mui/material";

export const Mixer: React.FC = () => {
  const [masterVolume, setMasterVolume] = React.useState<number>(75);

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setMasterVolume(newValue as number);
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
        <Stack spacing={2}>
          <Typography variant="body1">Master Volume</Typography>
          <Slider
            value={masterVolume}
            onChange={handleVolumeChange}
            aria-label="Master Volume"
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
        </Stack>
      </Paper>
    </Box>
  );
};
