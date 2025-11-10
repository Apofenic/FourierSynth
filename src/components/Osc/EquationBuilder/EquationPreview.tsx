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

import React, { useState, useEffect, useRef } from "react";
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
import { useEquationBuilderStore } from "../../../stores";

interface EquationPreviewProps {
  oscillatorIndex: number;
}

export function EquationPreview({ oscillatorIndex }: EquationPreviewProps) {
  const latexExpression = useEquationBuilderStore(
    (state) => state.oscillators[oscillatorIndex].latexExpression
  );
  const variables = useEquationBuilderStore(
    (state) => state.oscillators[oscillatorIndex].variables
  );
  const expression = useEquationBuilderStore(
    (state) => state.oscillators[oscillatorIndex].expression
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(24); // Starting font size in pixels
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null); // Separate ref for measurement

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

  // Dynamic font sizing to achieve 95% container width
  useEffect(() => {
    const adjustFontSize = () => {
      if (!measureRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const measureElement = measureRef.current;

      const targetWidth = container.clientWidth * 0.95; // 95% of container width
      const minFontSize = 12; // Minimum readable size
      const maxFontSize = 60; // Maximum size

      // Use double requestAnimationFrame to ensure KaTeX has rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Binary search for optimal font size
          let low = minFontSize;
          let high = maxFontSize;
          let bestFontSize = minFontSize;

          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            measureElement.style.fontSize = `${mid}px`;

            // Force reflow and measure - wait for next frame
            const contentWidth = measureElement.scrollWidth;

            if (contentWidth <= targetWidth) {
              bestFontSize = mid;
              low = mid + 1; // Try larger
            } else {
              high = mid - 1; // Try smaller
            }
          }

          // Set the optimal font size once
          setFontSize(bestFontSize);
        });
      });
    };

    // Initial adjustment on mount and when equation changes
    adjustFontSize();

    // Add resize observer to handle viewport/container size changes
    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [latexExpression]); // Re-run when equation updates

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

    // The equation content to render (both visible and hidden for measurement)
    const equationContent = (refProp?: any) => (
      <Box
        ref={refProp}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontSize: `${fontSize}px`,
        }}
      >
        <Typography
          variant="h3"
          component="span"
          sx={{
            fontFamily: "serif",
            fontSize: "inherit",
          }}
        >
          f(t) =
        </Typography>
        <Box
          sx={{
            overflow: "visible",
            fontSize: "inherit",
            "& .katex": {
              fontSize: "inherit",
            },
          }}
        >
          <BlockMath math={latexExpression} errorColor="#d32f2f" />
        </Box>
      </Box>
    );

    // Return both visible equation and hidden measurement element
    return (
      <>
        {equationContent(contentRef)}
        {/* Hidden element for measurement - same structure but invisible */}
        <Box
          sx={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          {equationContent(measureRef)}
        </Box>
      </>
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
        height: "100%",
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
          Equation Preview
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
        ref={containerRef}
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 2,
          overflow: "hidden",
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
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
}
