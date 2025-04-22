import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Define interfaces for our state
interface HarmonicParam {
  amplitude: number;
  phase: number;
}

function App() {
  // Audio context and node references
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // State for audio playing status
  const [isPlaying, setIsPlaying] = useState(false);

  // Fundamental frequency
  const [frequency, setFrequency] = useState(220);

  // Harmonics parameters (amplitude and phase for each harmonic)
  const [harmonics, setHarmonics] = useState<HarmonicParam[]>([
    { amplitude: 1.0, phase: 0 }, // Fundamental
    { amplitude: 0.5, phase: 0 }, // 2nd harmonic
    { amplitude: 0.33, phase: 0 }, // 3rd harmonic
    { amplitude: 0.25, phase: 0 }, // 4th harmonic
    { amplitude: 0.2, phase: 0 }, // 5th harmonic
    { amplitude: 0.16, phase: 0 }, // 6th harmonic
    { amplitude: 0.14, phase: 0 }, // 7th harmonic
    { amplitude: 0.125, phase: 0 }, // 8th harmonic
  ]);

  // Custom waveform array (will store our Fourier series output)
  const [waveform, setWaveform] = useState<Float32Array>(
    new Float32Array(2048).fill(0)
  );

  // Function to calculate waveform using Fourier series
  const calculateWaveform = () => {
    const newWaveform = new Float32Array(2048);
    const TWO_PI = Math.PI * 2;

    for (let i = 0; i < newWaveform.length; i++) {
      const x = i / newWaveform.length;
      let value = 0;

      // Sum up the harmonic components using Fourier series
      harmonics.forEach((harmonic, idx) => {
        const harmonicNumber = idx + 1;
        value +=
          harmonic.amplitude *
          Math.sin(TWO_PI * harmonicNumber * x + harmonic.phase);
      });

      // Normalize to the range [-1, 1]
      newWaveform[i] = value;
    }

    // Normalize the waveform to prevent clipping
    const maxAmplitude = Math.max(...Array.from(newWaveform).map(Math.abs));
    if (maxAmplitude > 1) {
      for (let i = 0; i < newWaveform.length; i++) {
        newWaveform[i] /= maxAmplitude;
      }
    }

    return newWaveform;
  };

  // Generate the Fourier series equation as a string
  const generateFourierEquation = () => {
    // Get active harmonics (non-zero amplitude)
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);

    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }

    // Show the general summation form
    let generalForm = `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;

    // Add coefficients table below
    generalForm += "\n\nWhere:";
    activeHarmonics.forEach((harmonic, idx) => {
      const n = idx + 1;
      const amplitude = harmonic.amplitude.toFixed(2);
      const phaseInPi = (harmonic.phase / Math.PI).toFixed(2);
      const phaseSign = harmonic.phase >= 0 ? "+" : "";

      generalForm += `\nA_${n} = ${amplitude}, \\phi_${n} = ${phaseSign}${phaseInPi}\\pi`;
    });

    return generalForm;
  };

  // Toggle oscillator on/off
  const toggleOscillator = () => {
    if (isPlaying) {
      // Stop the oscillator
      if (oscillatorNodeRef.current) {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
        oscillatorNodeRef.current = null;
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Update a single harmonic parameter
  const updateHarmonic = (
    index: number,
    paramType: "amplitude" | "phase",
    value: number
  ) => {
    const updatedHarmonics = [...harmonics];
    updatedHarmonics[index] = {
      ...updatedHarmonics[index],
      [paramType]: value,
    };
    setHarmonics(updatedHarmonics);
  };
  // Initialize or update the audio system
  useEffect(() => {
    if (isPlaying) {
      // Create new audio context if not already created
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5; // Set initial volume
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create oscillator node
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = frequency;

      // Generate and set custom waveform from Fourier series
      const calculatedWaveform = calculateWaveform();
      setWaveform(calculatedWaveform);

      // Create a custom wave table from our calculated waveform
      const waveTable = audioContext.createPeriodicWave(
        calculatedWaveform, // Real part (sine components)
        new Float32Array(calculatedWaveform.length).fill(0) // Imaginary part (cosine components)
      );

      oscillatorNode.setPeriodicWave(waveTable);
      oscillatorNode.connect(gainNode);
      oscillatorNode.start();
      oscillatorNodeRef.current = oscillatorNode;

      return () => {
        // Clean up
        if (oscillatorNodeRef.current) {
          oscillatorNodeRef.current.stop();
          oscillatorNodeRef.current.disconnect();
          oscillatorNodeRef.current = null;
        }
      };
    }
  }, [isPlaying, frequency, harmonics]);

  // Draw the waveform on canvas
  useEffect(() => {
    const canvas = document.getElementById(
      "waveform-canvas"
    ) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerY = canvas.height / 2;
        const scaleY = (canvas.height / 2) * 0.9; // 90% of half-height for padding

        // Draw center line (zero axis)
        ctx.beginPath();
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();

        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;

        // Start the path at the first point
        ctx.moveTo(0, centerY - waveform[0] * scaleY);

        // Connect all subsequent points
        for (let i = 1; i < waveform.length; i++) {
          const x = (i / waveform.length) * canvas.width;
          const y = centerY - waveform[i] * scaleY;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    }
  }, [waveform]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Fourier Series Synthesizer</h1>

        <div className="controls">
          <button
            onClick={toggleOscillator}
            className={`toggle-button ${isPlaying ? "active" : ""}`}
          >
            {isPlaying ? "Stop" : "Start"} Oscillator
          </button>

          <div className="slider-container">
            <label>
              Frequency: {frequency} Hz
              <input
                type="range"
                min="20"
                max="2000"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="main-content">
          <div className="visualization-container">
            <canvas
              id="waveform-canvas"
              width="600"
              height="200"
              style={{ border: "1px solid #333", margin: "20px 0" }}
            ></canvas>

            <div className="equation-box">
              <h3>Fourier Series Equation</h3>
              <div className="equation-display">
                <p>Where ω = 2π · {frequency} Hz</p>
                <div className="scrollable-equation">
                  {generateFourierEquation()}
                </div>
              </div>
            </div>
          </div>

          <div className="harmonics-container">
            <h3>Harmonic Components</h3>
            {harmonics.map((harmonic, idx) => (
              <div key={idx} className="harmonic-slider">
                <div className="harmonic-header">
                  Harmonic {idx + 1} ({(idx + 1) * frequency} Hz)
                </div>

                <label>
                  Amplitude: {harmonic.amplitude.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={harmonic.amplitude}
                    onChange={(e) =>
                      updateHarmonic(idx, "amplitude", Number(e.target.value))
                    }
                  />
                </label>

                <label>
                  Phase: {(harmonic.phase / Math.PI).toFixed(2)}π rad
                  <input
                    type="range"
                    min={-Math.PI}
                    max={Math.PI}
                    step="0.01"
                    value={harmonic.phase}
                    onChange={(e) =>
                      updateHarmonic(idx, "phase", Number(e.target.value))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
