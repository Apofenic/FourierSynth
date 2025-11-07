import React, { useEffect, useCallback, useRef } from "react";
import "./App.css";
import {
  Typography,
  CssBaseline,
  ThemeProvider,
  Paper,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import {
  SubtractiveControls,
  KeyboardControls,
  Mixer,
  OscControls,
  SequencerControls,
  EffectsControls,
} from "./components";
import { useSynthControlsStore, useAudioEngineStore } from "./stores";
import { theme } from "./theme";
import { calculateDetunedFrequency } from "./utils/helperFunctions";

function App() {
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeOsc, setActiveOsc] = React.useState(0);

  const isPlaying = useAudioEngineStore((state) => state.isPlaying);
  const startAudio = useAudioEngineStore((state) => state.startAudio);
  const stopAudio = useAudioEngineStore((state) => state.stopAudio);
  const triggerNoteOn = useAudioEngineStore((state) => state.triggerNoteOn);
  const triggerNoteOff = useAudioEngineStore((state) => state.triggerNoteOff);
  const getMaxReleaseTime = useAudioEngineStore(
    (state) => state.getMaxReleaseTime
  );
  const oscillators = useAudioEngineStore((state) => state.oscillators);
  const updateOscillatorFrequency = useAudioEngineStore(
    (state) => state.updateOscillatorFrequency
  );

  const keyboardNotes = useSynthControlsStore((state) => state.keyboardNotes);
  const synthOscillators = useSynthControlsStore((state) => state.oscillators);
  const keyboardEnabled = useSynthControlsStore(
    (state) => state.keyboardEnabled
  );
  const activeKey = useSynthControlsStore((state) => state.activeKey);
  const setActiveKey = useSynthControlsStore((state) => state.setActiveKey);
  const updateKeyboardNoteState = useSynthControlsStore(
    (state) => state.updateKeyboardNoteState
  );

  // Use refs to access the latest state without triggering effect re-runs
  const keyboardNotesRef = useRef(keyboardNotes);
  const synthOscillatorsRef = useRef(synthOscillators);
  const isPlayingRef = useRef(isPlaying);
  const activeKeyRef = useRef(activeKey);
  const keyboardEnabledRef = useRef(keyboardEnabled);
  const oscillatorsRef = useRef(oscillators);

  // Update refs when state changes
  useEffect(() => {
    keyboardNotesRef.current = keyboardNotes;
    synthOscillatorsRef.current = synthOscillators;
    isPlayingRef.current = isPlaying;
    activeKeyRef.current = activeKey;
    keyboardEnabledRef.current = keyboardEnabled;
    oscillatorsRef.current = oscillators;
  }, [
    keyboardNotes,
    synthOscillators,
    isPlaying,
    activeKey,
    keyboardEnabled,
    oscillators,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!keyboardEnabledRef.current) return;
      if (event.repeat) return;

      const keyPressed = event.key.toLowerCase();
      const note = keyboardNotesRef.current.find((n) => n.key === keyPressed);

      if (note) {
        // Update frequency for all active oscillators with detune applied
        oscillatorsRef.current.forEach((osc, index) => {
          if (osc.isActive) {
            const synthOsc = synthOscillatorsRef.current[index];
            const detunedFreq = calculateDetunedFrequency(
              note.frequency,
              synthOsc.detune.octave,
              synthOsc.detune.semitone,
              synthOsc.detune.cent
            );
            updateOscillatorFrequency(index, detunedFreq);
          }
        });

        updateKeyboardNoteState(keyPressed, true);
        setActiveKey(keyPressed);

        if (!isPlayingRef.current) {
          startAudio();
        }

        // Trigger ADSR envelopes
        triggerNoteOn();
      }
    },
    [
      updateOscillatorFrequency,
      updateKeyboardNoteState,
      setActiveKey,
      startAudio,
      triggerNoteOn,
    ]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!keyboardEnabledRef.current) return;

      const keyReleased = event.key.toLowerCase();
      const note = keyboardNotesRef.current.find((n) => n.key === keyReleased);

      if (note) {
        updateKeyboardNoteState(keyReleased, false);

        if (keyReleased === activeKeyRef.current) {
          setActiveKey(null);
        }

        const anyKeysActive = keyboardNotesRef.current.some(
          (n) => n.isActive && n.key !== keyReleased
        );

        if (!anyKeysActive && isPlayingRef.current) {
          // Trigger release envelope before stopping
          triggerNoteOff();

          // Stop audio after release phase completes
          // Calculate actual release time dynamically based on current ADSR settings
          const releaseTime = getMaxReleaseTime();
          setTimeout(() => {
            stopAudio();
          }, releaseTime);
        }
      }
    },
    [
      updateKeyboardNoteState,
      setActiveKey,
      stopAudio,
      triggerNoteOff,
      getMaxReleaseTime,
    ]
  );

  // Global keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOscChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveOsc(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "1fr 20fr 15fr",
          gap: 1,
          padding: "0.5rem",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header Section - Row 1, spans all 12 columns */}
        <Box sx={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <Typography variant="h1" align="left" sx={{ margin: 0 }}>
            Sigmatron
          </Typography>
        </Box>
        {/* Oscillator and Mixer Section - Row 2, spans all 12 columns */}
        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 2,
            display: "grid",
            gridTemplateColumns: "8fr 1fr",
            gap: 1,
            padding: 1,
            paddingLeft: 0,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                minHeight: 0,
                paddingLeft: 0,
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Tabs
                value={activeOsc}
                onChange={handleOscChange}
                aria-label="oscillator tabs"
                orientation="vertical"
                sx={{
                  paddingTop: "1rem",
                  flexShrink: 0,
                  "& .MuiTab-root": {
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px",
                    borderTopRightRadius: 0,
                  },
                  "& .MuiTabs-indicator": {
                    display: "none",
                  },
                  "& .MuiTab-root.Mui-selected": {
                    backgroundColor: "#45505A",
                  },
                  "& .MuiTab-root:hover": {
                    backgroundColor: "rgba(97, 218, 251, 0.1)",
                  },
                }}
              >
                <Tab label="Osc 1" />
                <Tab label="Osc 2" />
                <Tab label="Osc 3" />
                <Tab label="Osc 4" />
              </Tabs>
              <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                {activeOsc === 0 && <OscControls oscillatorIndex={0} />}
                {activeOsc === 1 && <OscControls oscillatorIndex={1} />}
                {activeOsc === 2 && <OscControls oscillatorIndex={2} />}
                {activeOsc === 3 && <OscControls oscillatorIndex={3} />}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Mixer />
          </Box>
        </Paper>
        {/* Controls Section - Row 3, spans all 12 columns */}
        <Paper
          sx={{
            gridColumn: "1 / -1",
            gridRow: 3,
            display: "grid",
            gridTemplateRows: "auto 1fr",
            overflow: "hidden",
            minHeight: 0,
            height: "100%",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="control tabs"
            sx={{
              paddingLeft: "1rem",
              flexShrink: 0,
              "& .MuiTab-root": {
                padding: "1rem 1.5rem",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root.Mui-selected": {
                backgroundColor: "#45505A",
              },
              "& .MuiTab-root:hover": {
                backgroundColor: "rgba(97, 218, 251, 0.1)",
              },
            }}
          >
            <Tab label="Subtractive Controls" />
            {/* <Tab label="Sequencer Controls" />
            <Tab label="Effects Controls" /> */}
            <Tab label="Keyboard Layout" />
          </Tabs>
          {activeTab === 0 && <SubtractiveControls />}
          {/* {activeTab === 2 && <SequencerControls />}
          {activeTab === 3 && <EffectsControls />} */}
          {activeTab === 4 && <KeyboardControls />}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
