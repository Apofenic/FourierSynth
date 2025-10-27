import React from "react";

export type WaveformType = "sine" | "triangle" | "square" | "sawtooth";

interface WaveformIconProps {
  type: WaveformType;
  size?: number;
  color?: string;
  title?: string;
  ariaLabel?: string;
}

export const WaveformIcon: React.FC<WaveformIconProps> = ({
  type,
  size = 24,
  color = "#1abc9c",
  title,
  ariaLabel,
}) => {
  switch (type) {
    case "sine":
      return (
        <span aria-label={ariaLabel || "sine wave"} title={title || "Sine"}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ verticalAlign: "middle" }}
          >
            <path
              d="M2 12c2-8 8 8 20 0"
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      );
    case "triangle":
      return (
        <span
          aria-label={ariaLabel || "triangle wave"}
          title={title || "Triangle"}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ verticalAlign: "middle" }}
          >
            <polyline
              points="2,20 12,4 22,20"
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      );
    case "square":
      return (
        <span aria-label={ariaLabel || "square wave"} title={title || "Square"}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ verticalAlign: "middle" }}
          >
            <polyline
              points="2,20 2,4 12,4 12,20"
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      );
    case "sawtooth":
      return (
        <span
          aria-label={ariaLabel || "sawtooth wave"}
          title={title || "Sawtooth"}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ verticalAlign: "middle" }}
          >
            <polyline
              points="2,20 2,4 22,20"
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      );
    default:
      return null;
  }
};
