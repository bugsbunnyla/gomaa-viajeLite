import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#d4af37", light: "#f4e4a6", dark: "#b8941d" },
        obsidian: "#0a0a0a",
        slate: { 850: "#1e293b", 950: "#020617" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;