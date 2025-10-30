import "./wdyr"; // Must be first import to set up why-did-you-render
import React from "react";
import ReactDOM from "react-dom/client";
import "./fonts.css";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
