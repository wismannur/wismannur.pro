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
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "spin-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
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
