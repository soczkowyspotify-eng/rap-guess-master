import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Storage } from "@/lib/storage";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface Ctx {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

function resolve(t: Theme): Resolved {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(r: Resolved) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", r === "dark");
  root.style.colorScheme = r;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    const stored = Storage.getSettings().theme ?? "system";
    setThemeState(stored);
    const r = resolve(stored);
    setResolved(r);
    apply(r);

    if (stored === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => { const r2 = mq.matches ? "dark" : "light"; setResolved(r2); apply(r2); };
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    const s = Storage.getSettings(); s.theme = t; Storage.saveSettings(s);
    const r = resolve(t);
    setResolved(r);
    apply(r);
  };

  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}