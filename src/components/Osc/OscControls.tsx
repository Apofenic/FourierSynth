import React from "react";
import { WaveformVisualizer, HarmonicsControl } from "..";
import { EquationBuilder } from "./EquationBuilder";
import { Box, Paper, Tabs, Tab } from "@mui/material";
import { TunerControls } from "./TunerControls";
import { HybridWaveformSync } from "./HybridWaveformSync";
import { useSynthControlsStore } from "../../stores";

interface OscControlsProps {
  oscillatorIndex: number;
}

export const OscControls: React.FC<OscControlsProps> = ({
  oscillatorIndex,
}) => {
  const activeTab = useSynthControlsStore((state) => state.activeTab);
  const setActiveTab = useSynthControlsStore((state) => state.setActiveTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue === 0 ? "equation" : "harmonic");
  };

  return (
    <Paper
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3.5fr",
        gap: 1,
        padding: 1,
        overflow: "hidden",
        minHeight: 0,
        height: "100%",
      }}
    >
      {/* Hybrid waveform sync component - combines equation + harmonics */}
      <HybridWaveformSync oscillatorIndex={oscillatorIndex} />

      <Box
        sx={{
          gap: 1,
          overflow: "hidden",
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "2.5fr 1fr",
        }}
      >
        <WaveformVisualizer oscillatorIndex={oscillatorIndex} />
        <TunerControls />
      </Box>
      <Box
        sx={{
          overflow: "hidden",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Paper
          sx={{
            display: "flex",
            padding: 1,
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeTab === "equation" ? 0 : 1}
            onChange={handleTabChange}
            aria-label="control tabs"
            sx={{
              paddingLeft: "1rem",
              flexShrink: 0,
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                padding: "1rem 1.5rem",
              },
              "& .MuiTab-root.Mui-selected": {
                backgroundColor: "#60727D",
              },
            }}
          >
            <Tab label="Equation Builder" />
            <Tab label="Partial controller" />
          </Tabs>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {activeTab === "equation" && (
              <EquationBuilder oscillatorIndex={oscillatorIndex} />
            )}
            {activeTab === "harmonic" && (
              <HarmonicsControl oscillatorIndex={oscillatorIndex} />
            )}
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};
