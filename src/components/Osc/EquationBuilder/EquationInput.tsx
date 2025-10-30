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
import {
  TextField,
  Box,
  IconButton,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useDrop } from "react-dnd";
import { useEquationBuilderStore } from "../../../stores";

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

export const equationPresets = [
  { name: "Sine", value: "sin(i*t)" },
  { name: "Sawtooth", value: "(1/i)*sin(i*t)" },
  { name: "Square", value: "((4/pi)*(1/(2*i-1)))*sin((2*i-1)*t)" },
];

/**
 * Equation input field with drop target and validation
 */
export const EquationInput = forwardRef<
  EquationInputHandle,
  EquationInputProps
>(({ maxLength = 200 }, ref) => {
  const expression = useEquationBuilderStore((state) => state.expression);
  const validationResult = useEquationBuilderStore(
    (state) => state.validationResult
  );
  const updateExpression = useEquationBuilderStore(
    (state) => state.updateExpression
  );

  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [localExpression, setLocalExpression] = useState<string>(expression);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
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
    // if (debounceTimerRef.current) {
    //   clearTimeout(debounceTimerRef.current);
    // }
    // debounceTimerRef.current = setTimeout(() => {
    //   updateExpression(newValue);
    // }, 300);
  };

  /**
   * Handle key down events
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // On Enter key (without Shift for multiline), immediately update the expression
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in multiline field
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      updateExpression(localExpression);
    }
  }; /**
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
    <Box>
      {/* Title with help icon */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: "text.secondary" }}
        >
          Equation Input
        </Typography>
        <IconButton
          size="small"
          onClick={() => setHelpModalOpen(true)}
          sx={{ color: "text.secondary" }}
          aria-label="Help"
        >
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
        <FormControl size="small" fullWidth>
          <InputLabel>Preset Equations</InputLabel>
          <Select
            labelId="preset-equations-label"
            id="preset-equations-select"
            value=""
            label="Preset Equations"
            onChange={(e) => {
              const selectedValue = e.target.value as string;
              setLocalExpression(selectedValue);
              updateExpression(selectedValue);
              setCursorPosition(selectedValue.length);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            {equationPresets.map((preset, index) => (
              <MenuItem key={index} value={preset.value}>
                {preset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Help Modal */}
      <Dialog
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
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
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#1e1e1e",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InfoOutlinedIcon />
            <Typography variant="h6">How to Use Equation Builder</Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setHelpModalOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            backgroundColor: "#1e1e1e",
          }}
        >
          <Typography variant="body2" component="div" sx={{ m: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              - Type or Drag Symbols from the symbol palette side bar into the
              Input Field.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              - Hit "Enter" to apply changes.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              How Summations Work:
            </Typography>
            <ul style={{ paddingLeft: "1.5rem", margin: "0 0 1rem 0" }}>
              <li>
                <strong>i</strong> = harmonic index (1, 2, 3, ...) -
                automatically included in every equation
              </li>
              <li>
                <strong>n</strong> = number of harmonics - control with slider
                to add more terms to the sum
              </li>
              <li>
                Your equation is automatically summed: Σ(i=1 to n) [your
                expression]
              </li>
            </ul>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Examples:
            </Typography>
            <Box
              component="ul"
              sx={{ paddingLeft: "1.5rem", margin: "0 0 1rem 0" }}
            >
              <li>
                <code style={{ backgroundColor: "#333", padding: "2px 6px" }}>
                  sin(i*t)
                </code>{" "}
                - Fourier series (fundamental + harmonics)
              </li>
              <li>
                <code style={{ backgroundColor: "#333", padding: "2px 6px" }}>
                  (1/i)*sin(i*t)
                </code>{" "}
                - Sawtooth wave (amplitude decreases with i)
              </li>
              <li>
                <code style={{ backgroundColor: "#333", padding: "2px 6px" }}>
                  (a/pi)*(1/i)*sin(i*pi*t/l)
                </code>{" "}
                - Classic sawtooth with amplitude (a) and period (l)
              </li>
              <li>
                <code style={{ backgroundColor: "#333", padding: "2px 6px" }}>
                  a*sin(i*t) + b*cos(i*t)
                </code>{" "}
                - Sine + cosine harmonics
              </li>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Variables:
            </Typography>
            <ul style={{ paddingLeft: "1.5rem", margin: "0 0 1rem 0" }}>
              <li>
                Use single letters (a, b, c, etc.) - sliders auto-generated
              </li>
              <li>
                Reserved: <strong>t</strong> (time), <strong>i</strong>{" "}
                (harmonic index), <strong>e</strong> (Euler's number),{" "}
                <strong>n</strong> (harmonic count)
              </li>
            </ul>
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Available Functions:
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            sin, cos, tan, exp, log, abs, sqrt, pow, asin, acos, atan, sinh,
            cosh, tanh, ceil, floor, round, sign
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: "#1e1e1e",
          }}
        >
          <Button onClick={() => setHelpModalOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>

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
            placeholder="e.g., (1/i)*sin(i*t) for sawtooth, or sin(i*t) for Fourier series. Σ(i=1 to n) applied automatically"
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
    </Box>
  );
});

EquationInput.displayName = "EquationInput";

export default EquationInput;
