"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ruang-aksara-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
    const frame = window.requestAnimationFrame(() => setIsDark(shouldUseDark));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const nextTheme = !isDark;
    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("ruang-aksara-theme", nextTheme ? "dark" : "light");
    setIsDark(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] px-3 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "◐"}</span>
      <span className="hidden sm:inline">{isDark ? "Terang" : "Gelap"}</span>
    </button>
  );
}
