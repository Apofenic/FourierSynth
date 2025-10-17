/**
 * EquationInput Component
 *
 * Input field for entering mathematical expressions with support for:
 * - Keyboard typing with real-time validation
 * - Drag-and-drop symbol insertion
 * - Cursor position tracking
 * - Error display
 * - Character limit
 */

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
  MouseEvent,
  KeyboardEvent,
} from "react";
import { TextField, Box, IconButton, Typography, Alert } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useDrop } from "react-dnd";
import { useEquationBuilder } from "../../../contexts/EquationBuilderContext";

/**
 * Props for EquationInput component
 */
interface EquationInputProps {
  /** Maximum character length for the expression */
  maxLength?: number;
}

/**
 * Methods exposed via ref
 */
export interface EquationInputHandle {
  insertAtCursor: (text: string) => void;
}

/**
 * Equation input field with drop target and validation
 */
export const EquationInput = forwardRef<
  EquationInputHandle,
  EquationInputProps
>(({ maxLength = 200 }, ref) => {
  const { expression, validationResult, updateExpression } =
    useEquationBuilder();

  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [localExpression, setLocalExpression] = useState<string>(expression);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local expression with context expression
  useEffect(() => {
    setLocalExpression(expression);
  }, [expression]);

  /**
   * Insert text at the current cursor position
   */
  const insertAtCursor = (text: string) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    // Handle multi-character insertions like "sin(" with automatic closing parenthesis
    let insertText = text;
    let cursorOffset = text.length;

    // Add closing parenthesis for functions
    if (text.endsWith("(") && !text.endsWith("()")) {
      insertText = text + ")";
      cursorOffset = text.length; // Position cursor between parentheses
    }

    const newExpression =
      localExpression.substring(0, start) +
      insertText +
      localExpression.substring(end);

    // Check max length
    if (newExpression.length > maxLength) {
      return;
    }

    setLocalExpression(newExpression);

    // Update cursor position
    const newCursorPos = start + cursorOffset;
    setCursorPosition(newCursorPos);

    // Debounced context update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateExpression(newExpression);
    }, 300);

    // Focus and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Expose insertAtCursor method via ref
  useImperativeHandle(ref, () => ({
    insertAtCursor,
  }));

  /**
   * Handle text input changes
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check max length
    if (newValue.length > maxLength) {
      return;
    }

    setLocalExpression(newValue);

    // Track cursor position
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);

    // Debounced context update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateExpression(newValue);
    }, 300);
  };

  /**
   * Handle key down events
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow default behavior for most keys
    // Can add custom shortcuts here if needed
  };

  /**
   * Handle click events to update cursor position
   */
  const handleClick = (e: MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    setLocalExpression("");
    updateExpression("");
    setCursorPosition(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Configure drop target for symbols
   */
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: "symbol",
      drop: (item: { value: string }) => {
        insertAtCursor(item.value);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [localExpression, cursorPosition]
  );

  // Determine border color based on validation
  const getBorderColor = () => {
    if (!localExpression) return undefined;
    if (!validationResult.isValid) return "error.main";
    if (validationResult.isValid && localExpression.length > 0)
      return "success.main";
    return undefined;
  };

  // Calculate if approaching character limit
  const isApproachingLimit = localExpression.length >= maxLength * 0.8;

  return (
    <Box ref={drop as any}>
      <Box
        sx={{
          position: "relative",
          border: 2,
          borderColor: isOver && canDrop ? "primary.main" : "transparent",
          borderRadius: 1,
          backgroundColor: isOver && canDrop ? "action.hover" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <TextField
          inputRef={inputRef}
          value={localExpression}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          placeholder="Enter equation: e.g., a*sin(b*t + c)"
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              fontFamily: "monospace",
              fontSize: "1.1rem",
              "& fieldset": {
                borderColor: getBorderColor(),
                borderWidth: getBorderColor() ? 2 : 1,
              },
            },
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
            },
          }}
          slotProps={{
            input: {
              endAdornment: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {/* Validation indicator */}
                  {localExpression &&
                    (validationResult.isValid ? (
                      <CheckCircleOutlineIcon
                        color="success"
                        fontSize="small"
                      />
                    ) : (
                      <ErrorOutlineIcon color="error" fontSize="small" />
                    ))}

                  {/* Clear button */}
                  {localExpression && (
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      aria-label="Clear expression"
                      title="Clear expression"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>
              ),
            },
          }}
        />

        {/* Character counter */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 14,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            color={isApproachingLimit ? "warning.main" : "text.secondary"}
          >
            {localExpression.length} / {maxLength}
          </Typography>
        </Box>
      </Box>

      {/* Validation error display */}
      {!validationResult.isValid && validationResult.errors.length > 0 && (
        <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 1 }}>
          {validationResult.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Drop zone hint */}
      {isOver && canDrop && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            backgroundColor: "primary.light",
            borderRadius: 1,
            opacity: 0.7,
          }}
        >
          <Typography variant="caption" color="primary.contrastText">
            Release to insert symbol
          </Typography>
        </Box>
      )}
    </Box>
  );
});

EquationInput.displayName = "EquationInput";

export default EquationInput;
