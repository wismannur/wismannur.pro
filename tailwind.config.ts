import type { Config } from "tailwindcss";

const customScreens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1110px",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "spin-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseGrow: { to: { transform: "scale(1.02)" } },
      },
      animation: {
        "spin-slow": "spin-slow 8s linear infinite",
        "spin-fast": "spin-fast 2s linear infinite",
      },
      screens: customScreens,
    },
    container: {
      screens: customScreens,
    },
  },
  plugins: [],
};
export default config;
