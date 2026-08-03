"use client";

import { useEffect, useState } from "react";

type ReaderTheme = "light" | "sepia" | "dark";

const FONT_SIZE_KEY = "reader-font-size";
const THEME_KEY = "reader-theme";

const themes: Record<ReaderTheme, { label: string; background: string; color: string }> = {
  light: { label: "Terang", background: "#fffdf8", color: "#26342c" },
  sepia: { label: "Sepia", background: "#f3e7cf", color: "#513c29" },
  dark: { label: "Gelap", background: "#18221d", color: "#e9f0eb" },
};

export function ReaderControls({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ReaderTheme>("light");

  useEffect(() => {
    const storedSize = Number(window.localStorage.getItem(FONT_SIZE_KEY));
    const storedTheme = window.localStorage.getItem(THEME_KEY) as ReaderTheme | null;
    const frame = window.requestAnimationFrame(() => {
      if (storedSize >= 16 && storedSize <= 24) setFontSize(storedSize);
      if (storedTheme && storedTheme in themes) setTheme(storedTheme);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function changeSize(amount: number) {
    const nextSize = Math.min(24, Math.max(16, fontSize + amount));
    setFontSize(nextSize);
    window.localStorage.setItem(FONT_SIZE_KEY, String(nextSize));
  }

  function changeTheme(nextTheme: ReaderTheme) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <div>
      <div className="sticky top-[4.5rem] z-20 mt-7 border-y border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_94%,transparent)] backdrop-blur-xl">
        <div className="page-shell flex min-h-15 flex-col justify-center gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:py-3">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <span className="text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">Tampilan baca</span>
            <div className="flex items-center gap-1.5" aria-label="Ukuran huruf">
              <button type="button" onClick={() => changeSize(-1)} disabled={fontSize === 16} className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-extrabold transition hover:border-[var(--accent)] disabled:opacity-40" aria-label="Perkecil teks">A−</button>
              <span className="min-w-8 text-center text-xs font-bold tabular-nums text-[var(--muted)]" aria-live="polite">{fontSize}</span>
              <button type="button" onClick={() => changeSize(1)} disabled={fontSize === 24} className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-extrabold transition hover:border-[var(--accent)] disabled:opacity-40" aria-label="Perbesar teks">A+</button>
            </div>
          </div>
          <fieldset className="grid grid-cols-3 gap-1.5" aria-label="Tema pembaca">
            <legend className="sr-only">Tema pembaca</legend>
            {(Object.keys(themes) as ReaderTheme[]).map((item) => <button key={item} type="button" onClick={() => changeTheme(item)} aria-pressed={theme === item} className={`min-h-9 rounded-xl border px-3 text-xs font-extrabold transition ${theme === item ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"}`}>{themes[item].label}</button>)}
          </fieldset>
        </div>
      </div>
      <article className="mx-auto my-7 max-w-[47rem] rounded-[1.4rem] border border-black/[0.035] px-5 py-8 shadow-[0_14px_38px_rgb(31_43_36_/_9%)] sm:my-12 sm:px-12 sm:py-12" style={{ backgroundColor: themes[theme].background, color: themes[theme].color }}>
        <div style={{ fontSize: `${fontSize}px` }} className="reader-copy font-[family-name:var(--font-lora)] leading-[1.95] tracking-[0.002em]">{children}</div>
      </article>
    </div>
  );
}
