/**
 * Variable Control Panel Component
 *
 * Dynamically generates controls for variables detected in the equation.
 * Each variable gets:
 * - A slider for continuous control
 * - A text input for precise values
 * - A settings button to configure range/step
 * - A reset button to restore default value
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Slider,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import UndoIcon from "@mui/icons-material/Undo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useEquationBuilder } from "../../../contexts/EquationBuilderContext";
import { VariableConfig } from "../../../types/equationBuilderTypes";

interface ConfigDialogState {
  open: boolean;
  variableName: string | null;
  config: Partial<VariableConfig>;
}

/**
 * VariableControlPanel Component
 *
 * Renders dynamic controls for all variables in the current equation.
 * Variables are automatically detected and controls are created on-the-fly.
 */
export function VariableControlPanel() {
  const {
    variables,
    updateVariable,
    updateVariableConfig,
    resetVariable,
    resetAllVariables,
  } = useEquationBuilder();

  const [configDialog, setConfigDialog] = useState<ConfigDialogState>({
    open: false,
    variableName: null,
    config: {},
  });

  const variableNames = Object.keys(variables).sort();

  /**
   * Open configuration dialog for a specific variable
   */
  const handleOpenConfig = (name: string) => {
    const variable = variables[name];
    setConfigDialog({
      open: true,
      variableName: name,
      config: {
        min: variable.min,
        max: variable.max,
        step: variable.step,
      },
    });
  };

  /**
   * Close configuration dialog without saving
   */
  const handleCloseConfig = () => {
    setConfigDialog({
      open: false,
      variableName: null,
      config: {},
    });
  };

  /**
   * Save configuration changes
   */
  const handleSaveConfig = () => {
    if (configDialog.variableName && configDialog.config) {
      updateVariableConfig(configDialog.variableName, configDialog.config);
    }
    handleCloseConfig();
  };

  /**
   * Update configuration in dialog state
   */
  const handleConfigChange = (field: keyof VariableConfig, value: number) => {
    setConfigDialog((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value,
      },
    }));
  };

  /**
   * Handle slider value change
   */
  const handleSliderChange =
    (name: string) => (_: Event, value: number | number[]) => {
      if (typeof value === "number") {
        updateVariable(name, value);
      }
    };

  /**
   * Handle text input value change
   */
  const handleInputChange =
    (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      if (!isNaN(value)) {
        const variable = variables[name];
        // Clamp value to min/max range
        const clampedValue = Math.max(
          variable.min,
          Math.min(variable.max, value)
        );
        updateVariable(name, clampedValue);
      }
    };

  /**
   * Handle reset individual variable
   */
  const handleReset = (name: string) => {
    resetVariable(name);
  };

  // Empty state: no variables detected
  if (variableNames.length === 0) {
    return (
      <Box
        sx={{
          padding: 3,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          No variables detected. Add variables to your equation.
        </Typography>
        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          Variables are single letters (a-z, A-Z) excluding reserved: t, i, e
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Variable Controls</Typography>
        <Tooltip title="Reset all variables to default values">
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={resetAllVariables}
            disabled={variableNames.length === 0}
          >
            Reset All
          </Button>
        </Tooltip>
      </Box>

      <Stack spacing={2}>
        {variableNames.map((name) => {
          const variable = variables[name];
          return (
            <Box
              key={name}
              sx={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 100px 40px 40px",
                gap: 1,
                alignItems: "center",
              }}
            >
              {/* Variable name label */}
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                {name}:
              </Typography>

              {/* Slider */}
              <Slider
                value={variable.value}
                min={variable.min}
                max={variable.max}
                step={variable.step}
                onChange={handleSliderChange(name)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => value.toFixed(2)}
                sx={{ mx: 1 }}
              />

              {/* Text input */}
              <TextField
                type="number"
                value={variable.value.toFixed(2)}
                onChange={handleInputChange(name)}
                size="small"
                inputProps={{
                  min: variable.min,
                  max: variable.max,
                  step: variable.step,
                  style: { textAlign: "right" },
                }}
                sx={{
                  "& input": {
                    fontFamily: "monospace",
                  },
                }}
              />

              {/* Reset button */}
              <Tooltip title="Reset to default value">
                <IconButton
                  size="small"
                  onClick={() => handleReset(name)}
                  disabled={variable.value === variable.defaultValue}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Settings button */}
              <Tooltip title="Configure min/max/step">
                <IconButton size="small" onClick={() => handleOpenConfig(name)}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Stack>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog.open}
        onClose={handleCloseConfig}
        maxWidth="sm"
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
            justifyContent: "center",
          },
          "& .MuiDialog-paper": {
            backgroundColor: "#1e1e1e",
            backgroundImage: "none",
            margin: "auto",
            width: "auto",
            minWidth: "400px",
            maxWidth: "600px",
            maxHeight: "90vh",
            height: "auto",
          },
        }}
      >
        <DialogTitle>
          Configure Variable: {configDialog.variableName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Minimum Value"
              type="number"
              value={configDialog.config.min ?? 0}
              onChange={(e) =>
                handleConfigChange("min", parseFloat(e.target.value))
              }
              fullWidth
              helperText="Minimum allowed value for the slider"
            />
            <TextField
              label="Maximum Value"
              type="number"
              value={configDialog.config.max ?? 2}
              onChange={(e) =>
                handleConfigChange("max", parseFloat(e.target.value))
              }
              fullWidth
              helperText="Maximum allowed value for the slider"
            />
            <TextField
              label="Step Size"
              type="number"
              value={configDialog.config.step ?? 0.01}
              onChange={(e) =>
                handleConfigChange("step", parseFloat(e.target.value))
              }
              fullWidth
              helperText="Increment size for the slider (e.g., 0.01 for fine control)"
              inputProps={{ min: 0.001, max: 1, step: 0.001 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button
            onClick={handleSaveConfig}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
