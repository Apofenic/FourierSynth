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

export function EquationPreview() {
  const latexExpression = useEquationBuilderStore((state) => state.latexExpression);
  const variables = useEquationBuilderStore((state) => state.variables);
  const expression = useEquationBuilderStore((state) => state.expression);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(24); // Starting font size in pixels
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Dynamic font sizing effect
  useEffect(() => {
    const adjustFontSize = () => {
      if (!contentRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const content = contentRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Start with a larger font size and reduce if needed
      let currentFontSize = 32; // Start at 32px - reasonable default
      const minFontSize = 14; // Minimum readable size
      const maxFontSize = 36; // Maximum size - prevent oversized equations

      // Set initial font size
      content.style.fontSize = `${currentFontSize}px`;

      // Give the browser time to render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Check if content overflows
          const contentWidth = content.scrollWidth;
          const contentHeight = content.scrollHeight;

          // Reduce font size until it fits, with some padding
          const paddingFactor = 0.95; // Use 95% of available space

          while (
            (contentWidth > containerWidth * paddingFactor ||
              contentHeight > containerHeight * paddingFactor) &&
            currentFontSize > minFontSize
          ) {
            currentFontSize -= 1;
            content.style.fontSize = `${currentFontSize}px`;

            // Re-check dimensions
            if (
              content.scrollWidth <= containerWidth * paddingFactor &&
              content.scrollHeight <= containerHeight * paddingFactor
            ) {
              break;
            }
          }

          // Cap at max font size for small equations
          if (currentFontSize > maxFontSize) {
            currentFontSize = maxFontSize;
          }

          setFontSize(currentFontSize);
        });
      });
    };

    // Adjust on mount and when equation changes
    adjustFontSize();

    // Add resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [latexExpression, expression]);

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
      <Box
        ref={contentRef}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          transition: "font-size 0.2s ease-out",
        }}
      >
        <Typography
          variant="h3"
          component="span"
          sx={{
            fontFamily: "serif",
            fontSize: `${fontSize}px`,
          }}
        >
          f(t) =
        </Typography>
        <Box
          sx={{
            overflow: "visible",
            maxWidth: "100%",
            fontSize: `${fontSize}px`,
            "& .katex": {
              fontSize: "inherit",
            },
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
