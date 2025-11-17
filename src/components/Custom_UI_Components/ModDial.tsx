import React, { useState, useEffect } from "react";
import { Dial } from "./Dial";
import {
  Box,
  Select,
  MenuItem,
  SelectChangeEvent,
  ListSubheader,
} from "@mui/material";
import { useModulationStore } from "../../stores/useModulationStore";
import { ModulationSource } from "../../types";

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
  minLabel?: string;
  maxLabel?: string;
  enableCenterDoubleClick?: boolean;
  // Modulation props
  paramId?: string;
  paramMin?: number;
  paramMax?: number;
  bipolar?: boolean;
}

/**
 * ModDial - A wrapper around the Dial component with two smaller dials and select inputs
 * Accepts all Dial props and passes them through
 * When paramId is provided, connects to modulation system
 */
export const ModDial: React.FC<ModDialProps> = (props) => {
  const {
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    baselineResolution,
    enableCenterDoubleClick,
    paramId,
    paramMin,
    paramMax,
    bipolar = false,
  } = props;

  // Local state for mod targets and amounts
  const [mod1Amount, setMod1Amount] = useState<number>(0);
  const [mod2Amount, setMod2Amount] = useState<number>(0);

  // Get modulation store
  const {
    routes,
    addModulationRoute,
    removeModulationRoute,
    updateModulationAmount,
  } = useModulationStore();

  // Get current routes for this parameter
  const paramRoutes = paramId ? routes[paramId] || [] : [];
  const slot1Route = paramRoutes.find((r) => r.slotIndex === 0);
  const slot2Route = paramRoutes.find((r) => r.slotIndex === 1);

  // Derive current sources from routes
  const mod1Target = slot1Route?.source || ModulationSource.NONE;
  const mod2Target = slot2Route?.source || ModulationSource.NONE;

  // Sync local amounts with store on mount and when routes change
  useEffect(() => {
    if (slot1Route) {
      setMod1Amount(slot1Route.amount);
    } else {
      setMod1Amount(0);
    }
  }, [slot1Route]);

  useEffect(() => {
    if (slot2Route) {
      setMod2Amount(slot2Route.amount);
    } else {
      setMod2Amount(0);
    }
  }, [slot2Route]);

  // Warn in dev mode if paramId is missing but modulation slots are being used
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      !paramId &&
      (mod1Target !== ModulationSource.NONE ||
        mod2Target !== ModulationSource.NONE)
    ) {
      console.warn(
        "ModDial: paramId is undefined but modulation slots are active. This may indicate a missing paramId prop."
      );
    }
  }, [paramId, mod1Target, mod2Target]);

  const handleMod1TargetChange = (event: SelectChangeEvent<string>) => {
    const newSource = event.target.value as ModulationSource;

    if (!paramId) {
      console.warn("ModDial: Cannot change modulation source without paramId");
      return;
    }

    if (newSource === ModulationSource.NONE) {
      // Remove the route
      removeModulationRoute(paramId, 0);
      setMod1Amount(0);
    } else {
      // Add or update route with 50% default amount
      const amount = mod1Amount || 50;
      addModulationRoute(paramId, 0, newSource, amount, bipolar);
      setMod1Amount(amount);
    }
  };

  const handleMod2TargetChange = (event: SelectChangeEvent<string>) => {
    const newSource = event.target.value as ModulationSource;

    if (!paramId) {
      console.warn("ModDial: Cannot change modulation source without paramId");
      return;
    }

    if (newSource === ModulationSource.NONE) {
      // Remove the route
      removeModulationRoute(paramId, 1);
      setMod2Amount(0);
    } else {
      // Add or update route with 50% default amount
      const amount = mod2Amount || 50;
      addModulationRoute(paramId, 1, newSource, amount, bipolar);
      setMod2Amount(amount);
    }
  };

  const handleMod1AmountChange = (newAmount: number) => {
    if (!paramId) return;

    setMod1Amount(newAmount);
    if (mod1Target !== ModulationSource.NONE) {
      updateModulationAmount(paramId, 0, newAmount);
    }
  };

  const handleMod2AmountChange = (newAmount: number) => {
    if (!paramId) return;

    setMod2Amount(newAmount);
    if (mod2Target !== ModulationSource.NONE) {
      updateModulationAmount(paramId, 1, newAmount);
    }
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
      <Dial
        {...props}
        ringColor={
          // Add subtle glow to main dial when modulations are active
          slot1Route || slot2Route ? "#4dabf7" : props.ringColor
        }
      />
      <Box
        sx={{
          overflow: "hidden",
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          marginTop: -1,
          gap: 0,
          opacity: paramId ? 1 : 0.3,
          pointerEvents: paramId ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            width: "50px",
            position: "relative",
          }}
        >
          {/* LED indicator for active modulation */}
          <Box
            sx={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor:
                mod1Target !== ModulationSource.NONE ? "#4dabf7" : "#333",
              boxShadow:
                mod1Target !== ModulationSource.NONE
                  ? "0 0 4px #4dabf7"
                  : "none",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
          />
          <Dial
            value={mod1Amount}
            min={0}
            max={100}
            step={1}
            onChange={handleMod1AmountChange}
            size={50}
            numberFontSize={10}
            disableOuterRing
            backgroundColor="#202020ff"
            ringColor={
              mod1Target !== ModulationSource.NONE ? "#4dabf7" : undefined
            }
            gap={0}
            hideStroke
            baselineResolution={baselineResolution}
            disabled={mod1Target === ModulationSource.NONE}
            enableCenterDoubleClick={enableCenterDoubleClick}
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
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              Oscillators
            </ListSubheader>
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
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              LFOs
            </ListSubheader>
            <MenuItem value="lfo1" sx={{ fontSize: "0.625rem" }}>
              LFO1
            </MenuItem>
            <MenuItem value="lfo2" sx={{ fontSize: "0.625rem" }}>
              LFO2
            </MenuItem>
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              Envelopes
            </ListSubheader>
            <MenuItem value="mod_env" sx={{ fontSize: "0.625rem" }}>
              MOD ENV
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
            position: "relative",
          }}
        >
          {/* LED indicator for active modulation */}
          <Box
            sx={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor:
                mod2Target !== ModulationSource.NONE ? "#4dabf7" : "#333",
              boxShadow:
                mod2Target !== ModulationSource.NONE
                  ? "0 0 4px #4dabf7"
                  : "none",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
          />
          <Dial
            value={mod2Amount}
            min={0}
            max={100}
            step={1}
            onChange={handleMod2AmountChange}
            size={50}
            disableOuterRing
            numberFontSize={10}
            backgroundColor="#202020ff"
            ringColor={
              mod2Target !== ModulationSource.NONE ? "#4dabf7" : undefined
            }
            gap={0}
            baselineResolution={baselineResolution}
            disabled={mod2Target === ModulationSource.NONE}
            enableCenterDoubleClick={enableCenterDoubleClick}
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
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              Oscillators
            </ListSubheader>
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
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              LFOs
            </ListSubheader>
            <MenuItem value="lfo1" sx={{ fontSize: "0.625rem" }}>
              LFO1
            </MenuItem>
            <MenuItem value="lfo2" sx={{ fontSize: "0.625rem" }}>
              LFO2
            </MenuItem>
            <ListSubheader sx={{ fontSize: "0.625rem", lineHeight: "1.2" }}>
              Envelopes
            </ListSubheader>
            <MenuItem value="mod_env" sx={{ fontSize: "0.625rem" }}>
              MOD ENV
            </MenuItem>
          </Select>
        </Box>
      </Box>
    </Box>
  );
};
