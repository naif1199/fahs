import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-cairo)", "var(--font-ibm-arabic)", "sans-serif"]
      },
      colors: {
        security: "#0F5F5C",
        official: "#123047",
        charcoal: "#263238",
        muted: "#64748B",
        soft: "#F6F8F8",
        sand: "#D8C6A3",
        success: "#2E7D32",
        danger: "#B42318",
        warning: "#C47F17"
      },
      boxShadow: {
        card: "0 18px 60px rgba(18, 48, 71, 0.08)",
        soft: "0 10px 28px rgba(15, 95, 92, 0.12)"
      }
    }
  },
  plugins: [forms]
};

export default config;
