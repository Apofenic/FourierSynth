import React from "react";
import ReactDOM from "react-dom/client";
import "./fonts.css";
import "./index.css";
import App from "./App";
import { AudioEngineProvider } from "./contexts/AudioEngineContext";
import { SynthControlsProvider } from "./contexts/SynthControlsContext";
import { EquationBuilderProvider } from "./contexts/EquationBuilderContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <EquationBuilderProvider>
      <SynthControlsProvider>
        <AudioEngineProvider>
          <App />
        </AudioEngineProvider>
      </SynthControlsProvider>
    </EquationBuilderProvider>
  </React.StrictMode>
);
