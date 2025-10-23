/**
 * EquationPreview Component
 *
 * Displays a LaTeX-rendered preview of the current equation with:
 * - Real-time LaTeX rendering using KaTeX
 * - Copy to clipboard functionality
 * - Current variable values display
 * - Error handling with graceful fallbacks
 *
 * Part of PR #6: Equation Preview Component
 */

import React, { useState } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useEquationBuilder } from "../../../contexts/EquationBuilderContext";

export function EquationPreview() {
  const { latexExpression, variables, expression } = useEquationBuilder();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latexExpression);
      setCopySuccess(true);
    } catch (error) {
      console.error("Failed to copy LaTeX:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setCopySuccess(false);
  };

  const renderLatex = () => {
    // Empty expression case
    if (!expression || !latexExpression) {
      return (
        <Typography
          variant="h5"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            fontFamily: "monospace",
          }}
        >
          f(t) = ?
        </Typography>
      );
    }

    // Try to render LaTeX - BlockMath will handle errors internally
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h5" component="span" sx={{ fontFamily: "serif" }}>
          f(t) =
        </Typography>
        <Box
          sx={{
            overflow: "auto",
            maxWidth: "100%",
          }}
        >
          <BlockMath math={latexExpression} errorColor="#d32f2f" />
        </Box>
      </Box>
    );
  };

  const renderVariableValues = () => {
    const varEntries = Object.entries(variables);

    if (varEntries.length === 0) {
      return null;
    }

    const valueString = varEntries
      .map(([name, config]) => `${name} = ${config.value.toFixed(2)}`)
      .join(", ");

    return (
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 2,
          fontFamily: "monospace",
        }}
      >
        {valueString}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 1,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
    minHeight: 120,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    height: '100%',
    flexGrow: 1,
      }}
    >
      {/* Header with title and actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h3">
          LaTeX Preview
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Help tooltip */}
          <Tooltip title="This shows your equation in mathematical notation using LaTeX">
            <IconButton size="small" color="default">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Copy button */}
          <Tooltip title="Copy LaTeX to clipboard">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={handleCopyLatex}
                disabled={!latexExpression}
                aria-label="Copy LaTeX to clipboard"
                data-testid="copy-latex-button"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* LaTeX preview */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 2,
        }}
      >
        {renderLatex()}
      </Box>

      {/* Variable values */}
      {renderVariableValues()}

      {/* Copy success notification */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          LaTeX copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
}
