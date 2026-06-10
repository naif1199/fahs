"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("fahs-theme") === "dark" ? "dark" : "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark-theme", saved === "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("fahs-theme", next);
    document.documentElement.classList.toggle("dark-theme", next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="ui-button flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-official shadow-sm transition-[background-color,border-color,transform] duration-150 ease-out hover:border-security/25 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-security/25 active:scale-[.98]"
    >
      <span>{theme === "light" ? "الوضع النهاري" : "الوضع الليلي"}</span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-security/10 text-security">
        {theme === "light" ? <Sun size={17} /> : <Moon size={17} />}
      </span>
    </button>
  );
}