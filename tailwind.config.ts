import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-cairo)", "var(--font-ibm-arabic)", "Tahoma", "sans-serif"]
      },
      colors: {
        security: "#2A9D8F",
        official: "#264653",
        charcoal: "#23363C",
        muted: "#66777D",
        soft: "#FFF8EB",
        sand: "#E9C46A",
        success: "#2A9D8F",
        danger: "#E76F51",
        warning: "#F4A261"
      },
      boxShadow: {
        card: "0 14px 36px rgba(38, 70, 83, 0.08)",
        soft: "0 8px 18px rgba(42, 157, 143, 0.18)"
      }
    }
  },
  plugins: [forms]
};

export default config;
