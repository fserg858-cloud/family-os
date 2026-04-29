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
        bg: "#080808",
        surface: "#111111",
        surface2: "#171717",
        border: "#222222",
        accent: "#C9A84C",
        "accent-soft": "#C9A84C22",
        text: "#F0F0EE",
        muted: "#888888",
        success: "#7BB37B",
        danger: "#C96A6A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Bebas Neue", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 32px rgba(201,168,76,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
