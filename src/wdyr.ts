/// <reference types="@welldone-software/why-did-you-render" />
import React from "react";

// Temporarily disabled - uncomment to re-enable WDYR
/*
if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    trackExtraHooks: [[require("react"), "useContext"]],
    logOnDifferentValues: true,
    collapseGroups: true,
    // Focus on your app components only - exclude MUI noise
    include: [
      /^(Harmonic|Waveform|Equation|Keyboard|Filter|Envelope|LFO|Osc|Dial|App)/,
    ],
    exclude: [
      /^Connect/,
      /^Route/,
      /^ForwardRef/, // Exclude MUI internal components
      /^Styled/, // Exclude styled components
      /^Insertion/, // Exclude emotion/styled internals
      /^ToggleButton/, // MUI components
      /^ButtonBase/,
      /^Paper/,
      /^Box/,
      /^Typography/,
      /^IconButton/,
      /^Tooltip/,
      /^Snackbar/,
      /^Alert/,
    ],
    onlyLogs: true,
    logOwnerReasons: true,
  });
}
*/
