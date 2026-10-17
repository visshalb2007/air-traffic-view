import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: "#070c14",
          card: "#0d1624",
          border: "#1b2c47",
          hover: "#16253b",
          primary: "#00e5ff",
          green: "#00ff88",
          yellow: "#ffcc00",
          orange: "#ff8800",
          red: "#ff2a55",
          purple: "#b366ff",
          text: "#e1e9f5",
          muted: "#7b93b4",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 6px rgba(0, 229, 255, 0.8))" },
          "50%": { opacity: "0.5", filter: "drop-shadow(0 0 2px rgba(0, 229, 255, 0.3))" },
        },
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "sweep 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
