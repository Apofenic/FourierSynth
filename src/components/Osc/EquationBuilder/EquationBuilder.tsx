/**
 * EquationBuilder Component
 *
 * Main container component that integrates all equation builder child components:
 * - SymbolPalette: Left panel with draggable/clickable symbols
 * - EquationInput: Input field with drop target and validation
 * - EquationPreview: LaTeX preview of the equation
 * - VariableControlPanel: Dynamic controls for detected variables
 *
 * Uses a responsive split-panel layout that adapts to different screen sizes.
 *
 * Part of PR #7: Main EquationBuilder Component
 */

import React, { useRef, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { EquationBuilderProvider } from "../../../contexts/EquationBuilderContext";
import SymbolPalette from "./SymbolPalette";
import EquationInput, { EquationInputHandle } from "./EquationInput";
import { EquationPreview } from "./EquationPreview";
import { VariableControlPanel } from "./VariableControlPanel";

/**
 * EquationBuilder Component
 *
 * Provides a complete interface for building custom mathematical equations
 * for audio synthesis.
 */
export const EquationBuilder: React.FC = () => {
  const inputRef = useRef<EquationInputHandle>(null);
  const [infoExpanded, setInfoExpanded] = React.useState(false);

  /**
   * Handle symbol click from palette - insert at cursor position
   */
  const handleSymbolClick = useCallback((symbolValue: string) => {
    if (inputRef.current) {
      inputRef.current.insertAtCursor(symbolValue);
    }
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <EquationBuilderProvider>
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Custom Equation Builder</Typography>
                <Tooltip title="Learn more about the equation builder">
                  <IconButton
                    size="small"
                    sx={{ color: "white" }}
                    onClick={() => setInfoExpanded(!infoExpanded)}
                  >
                    {infoExpanded ? <ExpandLessIcon /> : <HelpOutlineIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Info Section */}
            <Collapse in={infoExpanded}>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "white", mb: 1, fontWeight: 500 }}
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: 16, mr: 0.5, verticalAlign: "text-bottom" }}
                  />
                  How to use:
                </Typography>
                <Typography
                  variant="body2"
                  component="ul"
                  sx={{ color: "rgba(255, 255, 255, 0.9)", pl: 2, m: 0 }}
                >
                  <li>Type or drag symbols to build your equation</li>
                  <li>
                    Use single-letter variables (a, b, c, etc.) - they'll be
                    auto-detected
                  </li>
                  <li>
                    Reserved: t (time), i (imaginary unit), e (Euler's number)
                  </li>
                  <li>Adjust variable sliders to hear changes in real-time</li>
                  <li>
                    Example: <code>a*sin(b*t + c)</code> creates an
                    amplitude-modulated sine wave
                  </li>
                </Typography>
                <Divider sx={{ my: 1, bgcolor: "rgba(255, 255, 255, 0.2)" }} />
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Available functions: sin, cos, tan, exp, log, abs, sqrt, pow,
                  asin, acos, atan, sinh, cosh, tanh, ceil, floor, round, sign
                </Typography>
              </Box>
            </Collapse>
          </Box>

          {/* Main Content Area */}
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grid
              container
              sx={{
                flex: 1,
                overflow: "hidden",
              }}
            >
              {/* Left Panel - Symbol Palette (30% width) */}
              <Grid
                size={{ xs: 12, md: 4, lg: 2 }}
                sx={{
                  height: { xs: "auto", md: "100%" },
                  maxHeight: { xs: "300px", md: "100%" },
                  overflow: "auto",

                  borderBottom: { xs: 1, md: 0 },
                  borderColor: "divider",
                }}
              >
                <SymbolPalette onSymbolClick={handleSymbolClick} />
              </Grid>

              {/* Right Panel - Input, Preview, Variables (70% width) */}
              <Grid
                size={{ xs: 12, md: 8, lg: 6 }}
                sx={{
                  height: { xs: "auto", md: "100%" },
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    gap: 2,
                    overflow: "auto",
                  }}
                >
                  {/* Equation Input */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
                    >
                      Expression Input
                    </Typography>
                    <EquationInput ref={inputRef} maxLength={200} />
                  </Box>

                  <Divider />

                  {/* Equation Preview */}
                  <Box>
                    <EquationPreview />
                  </Box>

                  {/* Variable Controls */}
                </Box>
              </Grid>
              <Grid
                size={{ xs: 12, md: 8, lg: 4 }}
                sx={{
                  height: { xs: "auto", md: "100%" },
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VariableControlPanel />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </EquationBuilderProvider>
    </DndProvider>
  );
};

export default EquationBuilder;
