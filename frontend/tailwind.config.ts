import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--bg-canvas)",
          subtle: "var(--bg-canvas-subtle)",
        },
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          highlight: "var(--bg-surface-highlight)",
        },
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-hover)",
          muted: "var(--brand-muted)",
        },
        status: {
          recovered: { DEFAULT: "var(--status-recovered)", soft: "var(--status-recovered-soft)" },
          atRisk: { DEFAULT: "var(--status-at-risk)", soft: "var(--status-at-risk-soft)" },
          inProgress: { DEFAULT: "var(--status-in-progress)", soft: "var(--status-in-progress-soft)" },
          escalated: { DEFAULT: "var(--status-escalated)", soft: "var(--status-escalated-soft)" },
          stopped: { DEFAULT: "var(--status-stopped)", soft: "var(--status-stopped-soft)" },
        },
        border: {
          subtle: "var(--border-subtle)",
          focus: "var(--border-focus)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "0.25rem", // 4px
        DEFAULT: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.75rem", // 12px
      },
    },
  },
  plugins: [],
};
export default config;
