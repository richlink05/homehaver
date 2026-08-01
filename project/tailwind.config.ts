import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#C8A044", deep: "#A8842E", soft: "#E7D6AC" },
        ink: "#111111",
        mist: "#F5F5F5",
        stone: "#8A8580",
        line: "#E7E4DE",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "'Noto Serif KR'", "serif"],
        sans: ["Pretendard", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
