import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B3B45", light: "#10505E" },
        teal: "#12849A",
        sea: "#2A9D8F",
        amber: "#E9A23B",
        coral: "#E2674E",
        paper: "#FFFFFF",
        light: "#F1F6F7",
        tint: "#E8F1F2",
        darktxt: "#12333B",
        muted: "#5B7079",
      },
    },
  },
  plugins: [],
} satisfies Config;
