import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { TRANSLATIONS, type Lang, LANGS } from "./translations";

export type LangPref = Lang | "auto";

const LS_KEY = "rg2-lang";
const SUPPORTED: Lang[] = ["pl", "en", "de", "fr"];

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "pl";
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of langs) {
    if (!raw) continue;
    const code = raw.toLowerCase().slice(0, 2) as Lang;
    if (SUPPORTED.includes(code)) return code;
  }
  return "en";
}

function readPref(): LangPref {
  if (typeof window === "undefined") return "auto";
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "pl" || v === "en" || v === "de" || v === "fr" || v === "auto") return v;
  } catch {}
  return "auto";
}

interface Ctx {
  lang: Lang;
  pref: LangPref;
  setPref: (p: LangPref) => void;
  t: (key: string) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LangPref>("auto");
  const [lang, setLang] = useState<Lang>("pl");

  useEffect(() => {
    const p = readPref();
    setPrefState(p);
    const l = p === "auto" ? detectLang() : p;
    setLang(l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const setPref = (p: LangPref) => {
    setPrefState(p);
    try { localStorage.setItem(LS_KEY, p); } catch {}
    const l = p === "auto" ? detectLang() : p;
    setLang(l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const t = (key: string): string => {
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS.pl[key] ?? key;
  };

  return <I18nCtx.Provider value={{ lang, pref, setPref, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export { LANGS };
export type { Lang };