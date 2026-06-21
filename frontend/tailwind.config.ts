import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B3B45", light: "#10505E" },
        ink2: "#10505E",
        teal: "#12849A",
        sea: "#2A9D8F",
        amber: "#E9A23B",
        coral: "#E2674E",
        paper: "#FFFFFF",
        light: "#F1F6F7",
        tint: "#E8F1F2",
        darktxt: "#12333B",
        muted: "#5B7079",
        "on-ink-muted": "#BFD8DC",
        "on-ink-subtle": "#9FC6CC",
        "on-ink-tertiary": "#7FA9AF",
        "on-ink-description": "#AFCDD2",
        "on-sea": "#06343A",
        "chart-grid": "#E2E8F0",
      },
    },
  },
  plugins: [],
} satisfies Config;
