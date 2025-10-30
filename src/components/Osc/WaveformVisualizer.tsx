import React, { useEffect, useRef } from "react";
import { Paper, Typography } from "@mui/material";
import { useSynthControlsStore } from "../../stores";

/**
 * WaveformVisualizer component
 * Displays a real-time visualization of the synthesized waveform on a canvas
 */
export const WaveformVisualizer: React.FC = () => {
  const waveformData = useSynthControlsStore((state) => state.waveformData);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Draw the waveform on canvas whenever waveformData changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas with dark gray background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    ctx.moveTo(0, centerY - waveformData[0] * scaleY);

    // Connect all subsequent points
    for (let i = 1; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * canvas.width;
      const y = centerY - waveformData[i] * scaleY;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }, [waveformData]);

  return (
    <Paper sx={{ mb: 2, height: "100%" }}>
      <Typography variant="h3" align="center">
        Waveform Visualization
      </Typography>
      <canvas
        ref={canvasRef}
        id="waveform-canvas"
        width={800}
        height={400}
        style={{
          width: "100%",
          height: "90%",
          border: "1px solid #333",
          display: "block",
        }}
      />
    </Paper>
  );
};
