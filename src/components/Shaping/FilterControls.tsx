import React from "react";
import { Paper, Typography, Box, Tooltip, Stack } from "@mui/material";
import { Dial, ModDial } from "../";
import { useAudioEngineStore } from "../../stores/useAudioEngineStore";

interface FilterControlsProps {
  cutoffFrequency: number;
  resonance: number;
  onCutoffChange: (event: Event, value: number | number[]) => void;
  onResonanceChange: (event: Event, value: number | number[]) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  cutoffFrequency,
  resonance,
  onCutoffChange,
  onResonanceChange,
}) => {
  const filterEnvelopeAmount = useAudioEngineStore(
    (state) => state.filterEnvelopeAmount
  );
  const updateFilterEnvelopeAmount = useAudioEngineStore(
    (state) => state.updateFilterEnvelopeAmount
  );

  const handleCutoffChange = (value: number) => {
    // Convert linear dial value (0-100) to logarithmic frequency (20-20000 Hz)
    const normalizedValue = value / 100;
    const frequency = 20 * Math.pow(1000, normalizedValue);
    onCutoffChange(new Event("change"), Math.round(frequency));
  };

  const handleResonanceChange = (value: number) => {
    // Convert dial value (0-100) to resonance (0-20)
    const resonanceValue = (value / 100) * 20;
    onResonanceChange(new Event("change"), resonanceValue);
  };

  // Convert frequency back to dial value (0-100)
  const cutoffDialValue =
    (Math.log(cutoffFrequency / 20) / Math.log(1000)) * 100;

  // Convert resonance to dial value (0-100)
  const resonanceDialValue = (resonance / 20) * 100;

  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gap: 1,
        p: 1,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          gridRow: 1,
        }}
      >
        Filters
      </Typography>
      <Tooltip
        title="This is a 4-pole (24dB/octave) low-pass filter achieved by cascading four 2-pole filters. Adjust the cutoff to remove high frequencies, and increase resonance for a more pronounced filter effect."
        arrow
        placement="top"
      >
        <Typography
          variant="h6"
          sx={{
            gridRow: 2,
            alignItems: `center`,
            justifyContent: `center`,
            display: `flex`,
            cursor: "help",
            textDecoration: "underline dotted",
            textUnderlineOffset: "4px",
          }}
        >
          4-Pole (24dB/oct) Low-Pass Filter
        </Typography>
      </Tooltip>

      <Box
        sx={{
          gridRow: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Stack spacing={1} alignItems="center" direction="row">
          <ModDial
            value={cutoffDialValue}
            min={0}
            max={100}
            onChange={handleCutoffChange}
            label="Cutoff"
            size={100}
            ringColor="#3498db"
            numberFontSize={18}
            minMaxFontSize={10}
            hideCenterNumber={true}
          />
          <ModDial
            value={resonanceDialValue}
            min={0}
            max={100}
            onChange={handleResonanceChange}
            label="Resonance"
            size={100}
            ringColor="#9b59b6"
            numberFontSize={18}
            minMaxFontSize={10}
            hideCenterNumber={true}
          />
          <Dial
            value={filterEnvelopeAmount}
            min={0}
            max={100}
            onChange={updateFilterEnvelopeAmount}
            label="Envelope Amt"
            size={75}
            ringColor="#e67e22"
            numberFontSize={18}
            minMaxFontSize={10}
            hideCenterNumber={true}
          />
        </Stack>
      </Box>
    </Paper>
  );
};
