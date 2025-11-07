import { Paper, Box } from "@mui/material";
import { useAudioEngineStore } from "../../stores";
import { FilterControls, LFOControls, ADSR } from "..";
import { useSynthControlsStore } from "../../stores/useSynthControlsStore";

export const SubtractiveControls = () => {
  const cutoffFrequency = useAudioEngineStore((state) => state.cutoffFrequency);
  const resonance = useAudioEngineStore((state) => state.resonance);
  const updateFilter = useAudioEngineStore((state) => state.updateFilter);
  const ampADSR = useSynthControlsStore((state) => state.ampADSR);
  const filterADSR = useSynthControlsStore((state) => state.filterADSR);
  const modADSR = useSynthControlsStore((state) => state.modADSR);
  const updateAmpADSR = useSynthControlsStore((state) => state.updateAmpADSR);
  const updateFilterADSR = useSynthControlsStore(
    (state) => state.updateFilterADSR
  );
  const updateModADSR = useSynthControlsStore((state) => state.updateModADSR);
  const handleCutoffChange = (_: Event, value: number | number[]) => {
    const newCutoff = value as number;
    updateFilter(newCutoff, resonance);
  };

  const handleResonanceChange = (_: Event, value: number | number[]) => {
    const newResonance = value as number;
    updateFilter(cutoffFrequency, newResonance);
  };

  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 1,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ gridRow: 1, minHeight: 0, overflow: "hidden" }}>
        <FilterControls
          cutoffFrequency={cutoffFrequency}
          resonance={resonance}
          onCutoffChange={handleCutoffChange}
          onResonanceChange={handleResonanceChange}
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridRow: 1,
          gap: 1,
          gridTemplateRows: "1fr 1fr 1fr",
          minHeight: "100%",
          overflow: "hidden",
        }}
      >
        <ADSR label="Amp Envelope" state={ampADSR} update={updateAmpADSR} />
        <ADSR
          label="Filter Envelope"
          state={filterADSR}
          update={updateFilterADSR}
        />
        <ADSR label="Mod Envelope" state={modADSR} update={updateModADSR} />
      </Box>
      <Box
        sx={{
          gridRow: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          minHeight: "100%",
          overflow: "hidden",
        }}
      >
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <LFOControls id={1} />
        </Box>
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <LFOControls id={2} />
        </Box>
      </Box>
    </Paper>
  );
};
