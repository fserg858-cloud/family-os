import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic palette (driven by CSS vars in globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "#4CAF50",
        danger: "#FF3B30",
        warning: "#FFB02E",

        // Member colors (constant across themes)
        m_fedor: "#C9A84C",
        m_ignat: "#4CAF50",
        m_nikolay: "#4A90D9",
        m_elena: "#FF6B8A",
        m_tatyana: "#9B59B6",
        m_polina: "#FF8FB1",

        // Category colors
        c_home: "#4A90D9",
        c_kids: "#FFB02E",
        c_health: "#4CAF50",
        c_shopping: "#FF6B8A",
        c_finance: "#9B59B6",
        c_other: "#8E8E93",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.35)",
        glow: "0 0 32px rgba(255,107,138,0.25)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
