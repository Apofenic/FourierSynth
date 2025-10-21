import React, { useRef, useState, useCallback, useEffect } from "react";
import { Box, Typography } from "@mui/material";

interface DialProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  onChange?: (value: number) => void;
  label?: string;
  unit?: string;
  ringColor?: string;
  backgroundColor?: string;
  textColor?: string;
  sensitivity?: number; // pixels per unit value
}

export const Dial: React.FC<DialProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  size = 200,
  onChange,
  label,
  unit = "",
  ringColor = "#2ecc71",
  backgroundColor = "#2a2e35",
  textColor = "#ffffff",
  sensitivity = 2,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const startY = useRef(0);
  const startValue = useRef(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Calculate progress percentage (0-1)
  const progress = (currentValue - min) / (max - min);

  // Convert progress to angle (starting from -135° to 135°, 270° total sweep)
  const startAngle = -135;
  const endAngle = 135;
  const totalSweep = endAngle - startAngle;
  const currentAngle = startAngle + progress * totalSweep;

  // SVG circle parameters
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.38; // Outer ring radius
  const strokeWidth = size * 0.08; // Narrower progress ring
  const innerRadius = radius - strokeWidth / 2;
  const innerCircleRadius = innerRadius * 0.85; // Larger inner circle (was 0.75)

  // Calculate SVG path for the progress arc
  const polarToCartesian = (angle: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      1,
      end.x,
      end.y,
    ].join(" ");
  };

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startY.current = e.clientY;
      startValue.current = currentValue;
    },
    [currentValue]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY.current - e.clientY; // Inverted so dragging up increases
      const deltaValue = deltaY / sensitivity;
      let newValue = startValue.current + deltaValue * step;

      // Clamp value
      newValue = Math.max(min, Math.min(max, newValue));

      // Round to step
      newValue = Math.round(newValue / step) * step;

      if (newValue !== currentValue) {
        setCurrentValue(newValue);
        onChange?.(newValue);
      }
    },
    [isDragging, sensitivity, step, min, max, currentValue, onChange]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate indicator triangle position (inside the inner circle, near the top)
  const indicatorAngle = currentAngle - 90; // Adjust for SVG coordinate system
  const indicatorRad = indicatorAngle * (Math.PI / 180);
  const indicatorDistance = innerRadius * 0.65; // Position within the inner circle
  const indicatorX = centerX + indicatorDistance * Math.cos(indicatorRad);
  const indicatorY = centerY + indicatorDistance * Math.sin(indicatorRad);
  const triangleSize = size * 0.03;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        userSelect: "none",
      }}
    >
      {label && (
        <Typography variant="caption" sx={{ color: textColor, opacity: 0.7 }}>
          {label}
        </Typography>
      )}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          cursor: isDragging ? "ns-resize" : "pointer",
          position: "relative",
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          style={{
            transform: "rotate(0deg)",
            overflow: "visible",
          }}
        >
          {/* Gradient definition for inner circle */}
          <defs>
            <radialGradient id={`dialGradient-${size}`} cx="50%" cy="35%">
              <stop offset="0%" stopColor="rgba(90, 95, 105, 1)" />
              <stop offset="100%" stopColor="rgba(35, 38, 42, 1)" />
            </radialGradient>
          </defs>

          {/* Background track (unfilled portion of progress ring) */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {progress > 0 && (
            <path
              d={describeArc(startAngle, currentAngle)}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                transition: isDragging ? "none" : "d 0.1s ease-out",
              }}
            />
          )}

          {/* Center circle (knob background with gradient) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerCircleRadius}
            fill={`url(#dialGradient-${size})`}
            stroke="rgba(0, 0, 0, 0.5)"
            strokeWidth={2}
          />

          {/* Indicator triangle - rotated to align with radius, with rounded edges */}
          <polygon
            points={`${indicatorX},${indicatorY - triangleSize} ${
              indicatorX - triangleSize * 0.866
            },${indicatorY + triangleSize * 0.5} ${
              indicatorX + triangleSize * 0.866
            },${indicatorY + triangleSize * 0.5}`}
            fill="rgba(200, 220, 240, 0.9)"
            stroke="rgba(200, 220, 240, 0.9)"
            strokeWidth={triangleSize * 0.85}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              transition: isDragging ? "none" : "all 0.1s ease-out",
              transformOrigin: `${indicatorX}px ${indicatorY}px`,
              transform: `rotate(${currentAngle}deg)`,
            }}
          />

          {/* Value text */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={size * 0.15}
            fontWeight="300"
            fontFamily="'Roboto', sans-serif"
            style={{ pointerEvents: "none" }}
          >
            {Math.round(currentValue)}
          </text>

          {/* Min label - positioned outside ring at start angle */}
          <text
            x={polarToCartesian(startAngle).x - strokeWidth * 1.5}
            y={polarToCartesian(startAngle).y + strokeWidth * 0.8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={size * 0.08}
            fontWeight="500"
            fontFamily="'Roboto', sans-serif"
            style={{ pointerEvents: "none" }}
          >
            {min}
          </text>

          {/* Max label - positioned outside ring at end angle */}
          <text
            x={polarToCartesian(endAngle).x + strokeWidth * 1.5}
            y={polarToCartesian(endAngle).y + strokeWidth * 0.8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={size * 0.08}
            fontWeight="500"
            fontFamily="'Roboto', sans-serif"
            style={{ pointerEvents: "none" }}
          >
            {max}
          </text>
        </svg>
      </Box>
    </Box>
  );
};
