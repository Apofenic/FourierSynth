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
import { Box, Paper, Grid, Typography, Divider } from "@mui/material";
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
            padding: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
