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
        security: "#005f73",
        official: "#001219",
        charcoal: "#001219",
        muted: "#005f73",
        soft: "#e9d8a6",
        sand: "#94d2bd",
        success: "#0a9396",
        danger: "#ae2012",
        warning: "#ee9b00",
        caramel: "#ca6702",
        spice: "#bb3e03",
        brownred: "#9b2226"
      },
      boxShadow: {
        card: "0 14px 36px rgba(0, 18, 25, 0.10)",
        soft: "0 8px 18px rgba(0, 95, 115, 0.20)"
      }
    }
  },
  plugins: [forms]
};

export default config;
