import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mint: {
          DEFAULT: "#4FD1C7",
          light: "#81E6D9",
          dark: "#38B2AC",
        },
        /** System operator console (distinct from merchant /admin). */
        sys: {
          bg: "#020617",
          surface: "#0f172a",
          border: "#1e293b",
          accent: "#22d3ee",
          accentMuted: "#0891b2",
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [typography],
};
export default config;
