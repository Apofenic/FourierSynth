/**
 * SymbolPalette Component
 *
 * A vertical panel displaying mathematical symbols organized by category.
 * Symbols can be clicked to insert at cursor position or dragged into
 * the equation input field.
 */

import React, { useState } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  Tooltip,
  Typography,
} from "@mui/material";
import { useDrag } from "react-dnd";
import { Symbol } from "../../types/equationBuilderTypes";
import {
  getSymbolsByCategory,
  getCategories,
  getCategoryDisplayName,
} from "../../data/symbols";

/**
 * Props for SymbolPalette component
 */
interface SymbolPaletteProps {
  /** Callback when a symbol is clicked */
  onSymbolClick: (value: string) => void;
}

/**
 * Individual draggable symbol button
 */
interface DraggableSymbolProps {
  symbol: Symbol;
  onClick: (value: string) => void;
}

/**
 * Draggable symbol button component
 */
function DraggableSymbol({ symbol, onClick }: DraggableSymbolProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "symbol",
      item: { value: symbol.value },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [symbol.value]
  );

  return (
    <Tooltip title={symbol.description} placement="right" arrow>
      <div
        ref={drag as any}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClick(symbol.value)}
          fullWidth
          sx={{
            minWidth: "48px",
            minHeight: "48px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "action.hover",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          {symbol.label}
        </Button>
      </div>
    </Tooltip>
  );
}

/**
 * Symbol palette component with categorized symbols
 */
export function SymbolPalette({ onSymbolClick }: SymbolPaletteProps) {
  const categories = getCategories();
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const currentCategory = categories[activeTab];
  const currentSymbols = getSymbolsByCategory(currentCategory);

  return (
    <Paper
      elevation={2}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" component="h2">
          Symbol Palette
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click or drag symbols to insert
        </Typography>
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        orientation="horizontal"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            minWidth: "auto",
            fontSize: "0.75rem",
          },
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category}
            label={getCategoryDisplayName(category)}
            id={`symbol-tab-${category}`}
            aria-controls={`symbol-panel-${category}`}
          />
        ))}
      </Tabs>

      {/* Symbol Grid */}
      <Box
        role="tabpanel"
        id={`symbol-panel-${currentCategory}`}
        aria-labelledby={`symbol-tab-${currentCategory}`}
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
            gap: 1,
          }}
        >
          {currentSymbols.map((symbol) => (
            <DraggableSymbol
              key={symbol.id}
              symbol={symbol}
              onClick={onSymbolClick}
            />
          ))}
        </Box>

        {/* Empty state */}
        {currentSymbols.length === 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "200px",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No symbols in this category
            </Typography>
          </Box>
        )}
      </Box>

      {/* Help text at bottom */}
      <Box
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: "divider",
          backgroundColor: "action.hover",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Reserved variables are t (time), i (imaginary), and e (Euler's
          number)
        </Typography>
      </Box>
    </Paper>
  );
}

export default SymbolPalette;
