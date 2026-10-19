import type { Config } from "tailwindcss";

// Identidade visual da A.A.A. CEFET/RJ: azul-marinho + vermelho + branco, fundo "papel".
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lobo: {
          navy: "#17275F",
          deep: "#0E1A45",
          blue: "#234184",
          red: "#D20C07",
          redDark: "#A50905",
          redLight: "#FF5A4F", // vermelho para texto sobre fundo azul (contraste)
          paper: "#F4EEEA",
          ink: "#101633",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        slidein: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "none" } },
        spinslow: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        rise: "rise .45s ease-out both",
        slidein: "slidein .25s ease-out both",
        spinslow: "spinslow 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
