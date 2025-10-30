/// <reference types="@welldone-software/why-did-you-render" />
import React from "react";

if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  console.log("🔍 WDYR is initializing...");
  whyDidYouRender(React, {
    trackAllPureComponents: false, // Only track components we explicitly mark
    trackHooks: true,
    trackExtraHooks: [[require("react"), "useContext"]],
    logOnDifferentValues: true,
    collapseGroups: true,
    // Don't use include/exclude - only track explicitly marked components
    // Custom notifier to reduce noise
    notifier: (notification: any) => {
      console.log(
        `%c${notification.Component.displayName || notification.Component.name} re-rendered`,
        "color: orange; font-weight: bold;"
      );
    },
  });
}
