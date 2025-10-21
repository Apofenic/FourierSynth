import React from "react";
import {
  WaveformVisualizer,
  EquationDisplay,
  SubtractiveControls,
  HarmonicsControl,
} from "..";
import {
  Box,
  Typography,
  Paper,
  Slider,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { TunerControls } from "./TunerControls";
import { EquationBuilder } from "./EquationBuilder";

export const OscControls: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      <Box
        sx={{
          gap: 1,
          overflow: "hidden",
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "2.5fr 1fr",
        }}
      >
        <WaveformVisualizer />
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
            value={activeTab}
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
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
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
            {activeTab === 0 && <EquationBuilder />}
            {activeTab === 1 && <HarmonicsControl />}
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};
