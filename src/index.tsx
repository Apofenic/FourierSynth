import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AudioEngineProvider } from "./contexts/AudioEngineContext";
import { SynthControlsProvider } from "./contexts/SynthControlsContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <SynthControlsProvider>
      <AudioEngineProvider>
        <App />
      </AudioEngineProvider>
    </SynthControlsProvider>
  </React.StrictMode>
);
