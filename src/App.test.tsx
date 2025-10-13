import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { AudioEngineProvider } from "./contexts/AudioEngineContext";
import { SynthControlsProvider } from "./contexts/SynthControlsContext";

test("renders Fourier Series Synthesizer heading", () => {
  render(
    <AudioEngineProvider>
      <SynthControlsProvider>
        <App />
      </SynthControlsProvider>
    </AudioEngineProvider>
  );
  const headingElement = screen.getByText(/Fourier Series Synthesizer/i);
  expect(headingElement).toBeInTheDocument();
});
