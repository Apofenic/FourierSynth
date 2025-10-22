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
  Box,
  Button,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useDrag } from "react-dnd";
import { Symbol } from "../../../types/equationBuilderTypes";
import {
  getSymbolsByCategory,
  getCategories,
  getCategoryDisplayName,
} from "../../../data/symbols";

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
            fontSize: ".875rem",
            fontWeight: "bold",
            color: "text.primary",
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

  const handleCategorySelect = (event: SelectChangeEvent<number>) => {
    setActiveTab(Number(event.target.value));
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
      <Box sx={{ p: 2 }}>
        <Tooltip
          title="💡 Tip: Use 'i' for harmonic index (1,2,3...), 'n' for total harmonics, 't' for time. Example: sin(i*t) creates a Fourier series."
          placement="top"
          arrow
        >
          <Typography variant="h6" component="h2">
            Symbol Palette
          </Typography>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          Click or drag symbols to insert
        </Typography>
      </Box>
      <FormControl size="small" fullWidth sx={{ mt: 1, mb: 1 }}>
        <InputLabel id="symbol-category-select-label">Categories</InputLabel>
        <Select
          labelId="symbol-category-select-label"
          id="symbol-category-select"
          value={activeTab}
          label="Categories"
          onChange={handleCategorySelect}
        >
          {categories.map((category, idx) => (
            <MenuItem key={category} value={idx}>
              {getCategoryDisplayName(category)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
    </Paper>
  );
}

export default SymbolPalette;
