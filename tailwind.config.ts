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
        security: "#606c38",
        official: "#283618",
        charcoal: "#283618",
        muted: "#606c38",
        soft: "#fefae0",
        sand: "#dda15e",
        success: "#606c38",
        danger: "#bc6c25",
        warning: "#dda15e",
        copper: "#bc6c25"
      },
      boxShadow: {
        card: "0 14px 36px rgba(40, 54, 24, 0.08)",
        soft: "0 8px 18px rgba(96, 108, 56, 0.16)"
      }
    }
  },
  plugins: [forms]
};

export default config;
