import type { Config } from "tailwindcss";
import tailwindScrollbar from "tailwind-scrollbar";
import tailwindAnimate from "tailwindcss-animate";
// import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define custom colors for both light and dark themes
        primary: {
          DEFAULT: "#F5FEFD", // Dark blue for light theme
          dark: "#0f172a", // Darker blue for dark theme
        },
        "primary-foreground": {
          DEFAULT: "#ffffff", // White text for light theme
          dark: "#e2e8f0", // Lighter gray for dark theme
        },
        secondary: {
          DEFAULT: "#3b82f6", // Blue for light theme
          dark: "#60a5fa", // Slightly lighter blue for dark theme
        },
        outline: {
          DEFAULT: "#64748b", // Gray for light theme
          dark: "#94a3b8", // Lighter gray for dark theme
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: {
          DEFAULT: "#f8fafc", // Light gray for light theme
          dark: "#1e293b", // Dark blue for dark theme background
        },
        border: "hsl(var(--border))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
      },
    },
  },
  plugins: [
    tailwindAnimate,
    tailwindScrollbar,
  ],
} satisfies Config;
