"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme) ?? "light";
    setTheme(current);
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        aria-label="Light"
        data-active={theme === "light"}
        onClick={() => apply("light")}
      >
        ☀
      </button>
      <button
        type="button"
        aria-label="Dark"
        data-active={theme === "dark"}
        onClick={() => apply("dark")}
      >
        ☾
      </button>
    </div>
  );
}
