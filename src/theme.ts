import { createTheme, Theme } from "@mui/material";

/**
 * FourierSynth application theme
 * Dark mode theme with custom colors and component overrides
 */
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#61dafb",
    },
    secondary: {
      main: "#4CAF50",
    },
    background: {
      default: "#282c34",
      paper: "rgba(97, 218, 251, 0.05)",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "1.5rem",
      fontWeight: 500,
      marginBottom: "1rem",
    },
    h3: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#61dafb",
      marginBottom: "0.5rem",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          // Don't apply to elevation papers (menus, dialogs, etc)
          "&:not(.MuiMenu-paper):not(.MuiDialog-paper):not(.MuiPopover-paper)":
            {
              backgroundColor: "rgba(97, 218, 251, 0.05)",
              padding: "8px", // Reduced padding
            },
          borderRadius: "8px",
          // Note: height removed to prevent modals/dropdowns from being full-height
          // Apply height: "100%" directly to specific components that need it
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2d3748",
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1e1e1e",
          backgroundImage: "none",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#61dafb",
          height: 8,
        },
        thumb: {
          height: 16,
          width: 16,
        },
        rail: {
          opacity: 0.5,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#61dafb",
          fontWeight: 700,
          paddingBottom: "1",
          textTransform: "none",
          minWidth: 0,
          minHeight: 0,
          paddingRight: "0.5rem",
          paddingLeft: "0.5rem",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          "& .MuiTabs-indicator": {
            display: "none",
          },
        },
      },
    },
  },
});
