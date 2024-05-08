/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#2e7d32", // Dark green on dark theme for primary
          "primary-content": "#ffffff", // White content on dark green background
          secondary: "#43a047", // Medium dark green for secondary
          "secondary-content": "#ffffff",
          accent: "#1b5e20", // Even darker green for accents
          "accent-content": "#ffffff",
          neutral: "#212638",
          "neutral-content": "#e8f5e9",
          "base-100": "#303030", // Darker background in dark theme
          "base-200": "#1b5e20", // Deep dark background
          "base-300": "#1b5e20", // Very dark green for tertiary areas
          "base-content": "#90ee90", // Text color on dark background
          info: "#2196f3",
          success: "#4caf50",
          warning: "#ffeb3b",
          error: "#f44336",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
        dark: {
          primary: "#2e7d32", // Dark green on dark theme for primary
          "primary-content": "#ffffff", // White content on dark green background
          secondary: "#43a047", // Medium dark green for secondary
          "secondary-content": "#ffffff",
          accent: "#1b5e20", // Even darker green for accents
          "accent-content": "#ffffff",
          neutral: "#212638",
          "neutral-content": "#e8f5e9",
          "base-100": "#303030", // Darker background in dark theme
          "base-200": "#1b5e20", // Deep dark background
          "base-300": "#1b5e20", // Very dark green for tertiary areas
          "base-content": "#90ee90", // Text color on dark background
          info: "#2196f3",
          success: "#4caf50",
          warning: "#ffeb3b",
          error: "#f44336",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
