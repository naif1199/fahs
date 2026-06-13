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
        security: "#0F5F5C",
        official: "#123047",
        charcoal: "#2F3437",
        muted: "#6B7280",
        soft: "#F6F7F5",
        sand: "#C8B27A",
        success: "#3F7D5A",
        danger: "#A33A2B",
        warning: "#B9852D"
      },
      boxShadow: {
        card: "0 14px 36px rgba(18, 48, 71, 0.07)",
        soft: "0 8px 18px rgba(15, 95, 92, 0.16)"
      }
    }
  },
  plugins: [forms]
};

export default config;
