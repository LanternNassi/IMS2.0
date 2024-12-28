'use client';

import { createTheme } from "@mui/material/styles";

const getTheme = (mode) => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: mode === "dark" ? "#0f172a" : "#000000", // Tailwind primary.dark / primary.DEFAULT
        },
        secondary: {
          main: mode === "dark" ? "#60a5fa" : "#3b82f6", // Tailwind secondary.dark / secondary.DEFAULT
        },
        text: {
            primary: mode === "dark" ? "#ffffff" : "#000000", // White in dark mode, black in light mode
            secondary: mode === "dark" ? "#ffffff" : "#4b5563", // Tailwind text-secondary colors
        },
        background: {
          default: mode === "dark" ? "#1e293b" : "#f8fafc", // Tailwind background.dark / background.DEFAULT
          paper: mode === "dark" ? "#1e293b" : "#f8fafc", // Same as background for consistency
        },
        action: {
          active: mode === "dark" ? "#60a5fa" : "#105D5E", // Matches Tailwind action colors
          focus: mode === "dark" ? "#60a5fa" : "#105D5E",
          selected: mode === "dark" ? "#60a5fa" : "#105D5E",
        },
      },
      colorSchemes: {
        dark: true,
      },
      typography: {
        fontFamily: 'Figtree, sans-serif',
        fontSize: 15,
      },
      shape: {
        borderRadius: 8, // Aligns with Tailwind's `borderRadius.lg`
      },
    });
  
export default getTheme;