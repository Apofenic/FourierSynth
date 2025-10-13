import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, IconButton, Collapse } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useAudioEngine } from "../contexts/AudioEngineContext";
import { useSynthControls } from "../contexts/SynthControlsContext";

/**
 * KeyboardControls component
 * Provides a visual keyboard with computer keyboard key mappings
 * Handles keydown/keyup events to trigger notes
 */
export const KeyboardControls: React.FC = () => {
  const { isPlaying, setIsPlaying, updateFrequency } = useAudioEngine();
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    keyboardNotes,
    keyboardEnabled,
    activeKey,
    setActiveKey,
    updateKeyboardNoteState,
  } = useSynthControls();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!keyboardEnabled) return;

    // Ignore repeated keydown events (key held down)
    if (event.repeat) return;

    // Find the matching note for this key
    const keyPressed = event.key.toLowerCase();
    const note = keyboardNotes.find((n) => n.key === keyPressed);

    if (note) {
      // Update frequency immediately (this will update the oscillator if playing)
      updateFrequency(note.frequency);

      // Update visual state
      updateKeyboardNoteState(keyPressed, true);
      setActiveKey(keyPressed);

      // Start the oscillator if it's not already playing
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!keyboardEnabled) return;

    const keyReleased = event.key.toLowerCase();
    const note = keyboardNotes.find((n) => n.key === keyReleased);

    if (note) {
      // Update keyboard notes state to show inactive key
      updateKeyboardNoteState(keyReleased, false);

      // Clear active key if this was it
      if (keyReleased === activeKey) {
        setActiveKey(null);
      }

      // Check if any other keys are still active (excluding the one we just released)
      const anyKeysActive = keyboardNotes.some(
        (n) => n.isActive && n.key !== keyReleased
      );

      // Stop the oscillator if no keys are active, regardless of which key was released
      if (!anyKeysActive && isPlaying) {
        setIsPlaying(false);
      }
    }
  };

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardEnabled, keyboardNotes, isPlaying, activeKey]);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Keyboard Controls
      </Typography>
      <Typography variant="body2" align="center" gutterBottom>
        Press keys on your keyboard to play notes. Active note:{" "}
        {activeKey
          ? keyboardNotes.find((note) => note.key === activeKey)?.note
          : "None"}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 0.5,
          my: 2,
        }}
      >
        {keyboardNotes.map((note, index) => (
          <Paper
            key={index}
            sx={{
              p: 1,
              minWidth: "40px",
              textAlign: "center",
              bgcolor: note.isActive
                ? "secondary.main"
                : note.note.includes("#")
                ? "#333"
                : "#fff",
              color: note.note.includes("#") ? "#fff" : "#000",
              border: "1px solid #666",
              boxShadow: note.isActive ? 4 : 1,
              transition: "all 0.1s ease",
              position: note.note.includes("#") ? "relative" : "static",
              zIndex: note.note.includes("#") ? 1 : "auto",
              transform: note.isActive ? "translateY(2px)" : "none",
            }}
          >
            <Typography variant="caption" display="block">
              {note.key}
            </Typography>
            <Typography variant="body2">{note.note}</Typography>
            <Typography variant="caption" display="block">
              {note.frequency.toFixed(0)} Hz
            </Typography>
          </Paper>
        ))}
      </Box>
      <Typography variant="caption" align="center" display="block">
        Keyboard layout follows a piano layout (A-K keys for white notes, W-P
        for black notes)
      </Typography>
    </Paper>
  );
};
