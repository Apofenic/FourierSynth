import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { useSynthControlsStore } from "../stores";

/**
 * KeyboardControls component
 * Provides a visual keyboard with computer keyboard key mappings
 * Handles keydown/keyup events to trigger notes
 */
export const KeyboardControls: React.FC = () => {
  const keyboardNotes = useSynthControlsStore((state) => state.keyboardNotes);
  const keyboardEnabled = useSynthControlsStore(
    (state) => state.keyboardEnabled
  );
  const activeKey = useSynthControlsStore((state) => state.activeKey);

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
