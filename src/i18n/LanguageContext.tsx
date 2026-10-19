// Langue choisie pour toute la plateforme.
//
// Le choix est retenu d'un passage à l'autre (localStorage) et, à défaut,
// déduit de la langue du navigateur. Il est aussi posé sur la balise <html>,
// ce qui règle la césure, la prononciation des lecteurs d'écran et le
// dictionnaire de correction des champs de saisie.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, createTranslator, isLanguage } from './translations';
import type { Language, Translator } from './translations';

const STORAGE_KEY = 'maintex.language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translator;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Langue retenue, sinon celle du navigateur, sinon le français. */
export function detectLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Stockage indisponible (navigation privée, cookies bloqués) : sans conséquence.
  }
  const candidates = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const candidate of candidates) {
    const base = String(candidate || '').slice(0, 2).toLowerCase();
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());

  useEffect(() => {
    const entry = LANGUAGES.find((candidate) => candidate.code === language);
    if (entry && typeof document !== 'undefined') document.documentElement.lang = entry.htmlLang;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Le choix vaudra pour cette visite seulement.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t: createTranslator(language) }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Langue courante et traducteur. */
export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n doit être utilisé à l’intérieur de LanguageProvider');
  return context;
}
