"use client";

import { useEffect, useState } from "react";

type ReaderTheme = "light" | "sepia" | "dark";

const themes: Record<ReaderTheme, { label: string; background: string; color: string }> = {
  light: { label: "Terang", background: "#fffdf7", color: "#26332c" },
  sepia: { label: "Sepia", background: "#f5ead1", color: "#5c4127" },
  dark: { label: "Gelap", background: "#172019", color: "#e8eee8" },
};

export function ReaderControls({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ReaderTheme>("light");

  useEffect(() => {
    const storedSize = Number(window.localStorage.getItem("reader-font-size"));
    const storedTheme = window.localStorage.getItem("reader-theme") as ReaderTheme | null;
    const frame = window.requestAnimationFrame(() => {
      if (storedSize >= 16 && storedSize <= 24) setFontSize(storedSize);
      if (storedTheme && storedTheme in themes) setTheme(storedTheme);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function changeSize(amount: number) {
    const nextSize = Math.min(24, Math.max(16, fontSize + amount));
    setFontSize(nextSize);
    window.localStorage.setItem("reader-font-size", String(nextSize));
  }

  function changeTheme(nextTheme: ReaderTheme) {
    setTheme(nextTheme);
    window.localStorage.setItem("reader-theme", nextTheme);
  }

  return (
    <div>
      <div className="sticky top-16 z-10 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_95%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2" aria-label="Ukuran huruf">
            <span className="text-sm font-semibold">Teks</span>
            <button type="button" onClick={() => changeSize(-1)} disabled={fontSize === 16} className="h-9 w-9 rounded-full border border-[var(--border)] font-bold disabled:opacity-40" aria-label="Perkecil teks">A−</button>
            <button type="button" onClick={() => changeSize(1)} disabled={fontSize === 24} className="h-9 w-9 rounded-full border border-[var(--border)] font-bold disabled:opacity-40" aria-label="Perbesar teks">A+</button>
          </div>
          <fieldset className="flex items-center gap-1" aria-label="Tema pembaca">
            <legend className="sr-only">Tema pembaca</legend>
            {(Object.keys(themes) as ReaderTheme[]).map((item) => <button key={item} type="button" onClick={() => changeTheme(item)} aria-pressed={theme === item} className={`min-h-9 rounded-full border px-3 text-xs font-bold ${theme === item ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)]"}`}>{themes[item].label}</button>)}
          </fieldset>
        </div>
      </div>
      <article className="mx-auto my-8 max-w-3xl rounded-2xl px-5 py-8 shadow-sm sm:my-12 sm:px-12 sm:py-12" style={{ backgroundColor: themes[theme].background, color: themes[theme].color }}>
        <div style={{ fontSize: `${fontSize}px` }} className="font-[family-name:var(--font-lora)] leading-[1.95]">{children}</div>
      </article>
    </div>
  );
}
