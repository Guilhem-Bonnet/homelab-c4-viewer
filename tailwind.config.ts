import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#020617",
        panel: "#060f1f",
        line: "#1e293b",
      },
    },
  },
  plugins: [],
};

export default config;
