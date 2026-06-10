"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("fahs-theme") === "light" ? "light" : "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("light-theme", saved === "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("fahs-theme", next);
    document.documentElement.classList.toggle("light-theme", next === "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center justify-between rounded-2xl border border-white/12 bg-white/[0.055] px-4 py-3 text-sm font-bold text-muted transition hover:bg-white/10 hover:text-white"
    >
      <span>{theme === "dark" ? "الوضع الليلي" : "الوضع النهاري"}</span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sand">
        {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
      </span>
    </button>
  );
}
