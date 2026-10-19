import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lobo: {
          navy: "#0B1F3A",
          deep: "#071528",
          blue: "#16345F",
          gold: "#F5B700",
          goldDark: "#C99400",
          ice: "#F4F6FA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        slidein: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "none" } },
      },
      animation: {
        rise: "rise .45s ease-out both",
        slidein: "slidein .25s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
