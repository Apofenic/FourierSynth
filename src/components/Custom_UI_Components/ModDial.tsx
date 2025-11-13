import React, { useState } from "react";
import { Dial } from "./Dial";
import { Box, Select, MenuItem, SelectChangeEvent } from "@mui/material";

interface ModDialProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  onChange?: (value: number) => void;
  label?: string;
  ringColor?: string;
  backgroundColor?: string;
  textColor?: string;
  sensitivity?: number;
  disableOuterRing?: boolean;
  labelBelow?: boolean;
  numberFontSize?: number;
  minMaxFontSize?: number;
  hideCenterNumber?: boolean;
  gap?: number;
  hideStroke?: boolean;
  baselineResolution?: number;
}

/**
 * ModDial - A wrapper around the Dial component with two smaller dials and select inputs
 * Accepts all Dial props and passes them through
 */
export const ModDial: React.FC<ModDialProps> = (props) => {
  const {
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    baselineResolution,
  } = props;
  const [mod1Target, setMod1Target] = useState<string>("none");
  const [mod2Target, setMod2Target] = useState<string>("none");

  const handleMod1TargetChange = (event: SelectChangeEvent<string>) => {
    setMod1Target(event.target.value);
  };

  const handleMod2TargetChange = (event: SelectChangeEvent<string>) => {
    setMod2Target(event.target.value);
  };

  const selectStyles = {
    fontSize: "0.625rem",
    height: "16px",
    minHeight: "16px",
    width: "50px",
    textAlign: "center",
    marginTop: "-8px",
    "& .MuiSelect-select": {
      padding: "0 !important",
      fontSize: "0.625rem",
      lineHeight: "16px",
      textAlign: "center",
      paddingRight: "0 !important",
    },
    "& .MuiSelect-icon": {
      right: "0",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderWidth: "1px",
      opacity: 0,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      opacity: 1,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      opacity: 1,
    },
    "& .MuiSvgIcon-root": {
      fontSize: "0.875rem",
      opacity: 0,
    },
    "&:hover .MuiSvgIcon-root": {
      opacity: 1,
    },
    "&.Mui-focused .MuiSvgIcon-root": {
      opacity: 1,
    },
  };

  return (
    <Box>
      <Dial {...props} />
      <Box
        sx={{
          overflow: "hidden",
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          marginTop: -1,
          gap: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            width: "50px",
          }}
        >
          <Dial
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            size={50}
            numberFontSize={10}
            disableOuterRing
            backgroundColor="#202020ff"
            gap={0}
            hideStroke
            baselineResolution={baselineResolution}
            disabled={mod1Target === "none"}
          />
          <Select
            size="small"
            value={mod1Target}
            onChange={handleMod1TargetChange}
            sx={selectStyles}
          >
            <MenuItem value="none" sx={{ fontSize: "0.625rem" }}>
              --
            </MenuItem>
            <MenuItem value="env" sx={{ fontSize: "0.625rem" }}>
              ENV
            </MenuItem>
            <MenuItem value="lfo1" sx={{ fontSize: "0.625rem" }}>
              LFO1
            </MenuItem>
            <MenuItem value="lfo2" sx={{ fontSize: "0.625rem" }}>
              LFO2
            </MenuItem>
            <MenuItem value="osc1" sx={{ fontSize: "0.625rem" }}>
              OSC1
            </MenuItem>
            <MenuItem value="osc2" sx={{ fontSize: "0.625rem" }}>
              OSC2
            </MenuItem>
            <MenuItem value="osc3" sx={{ fontSize: "0.625rem" }}>
              OSC3
            </MenuItem>
            <MenuItem value="osc4" sx={{ fontSize: "0.625rem" }}>
              OSC4
            </MenuItem>
          </Select>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            width: "50px",
          }}
        >
          <Dial
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            size={50}
            disableOuterRing
            numberFontSize={10}
            backgroundColor="#202020ff"
            gap={0}
            baselineResolution={baselineResolution}
            disabled={mod2Target === "none"}
          />
          <Select
            size="small"
            value={mod2Target}
            onChange={handleMod2TargetChange}
            sx={selectStyles}
          >
            <MenuItem value="none" sx={{ fontSize: "0.625rem" }}>
              --
            </MenuItem>
            <MenuItem value="env" sx={{ fontSize: "0.625rem" }}>
              ENV
            </MenuItem>
            <MenuItem value="lfo1" sx={{ fontSize: "0.625rem" }}>
              LFO1
            </MenuItem>
            <MenuItem value="lfo2" sx={{ fontSize: "0.625rem" }}>
              LFO2
            </MenuItem>
          </Select>
        </Box>
      </Box>
    </Box>
  );
};
